from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    WebDriverException
)
from webdriver_manager.chrome import ChromeDriverManager
import time
import json
import mysql.connector
from mysql.connector import Error
from typing import Dict, List, Any, Optional, Union

# Configuración global
def setup_driver(headless: bool = True) -> webdriver.Chrome:
    """
    Configura y retorna una instancia del navegador Chrome.
    
    Args:
        headless: Si es True, el navegador se ejecutará en modo sin cabeza (sin interfaz gráfica).
        
    Returns:
        Instancia configurada de webdriver.Chrome
    """
    chrome_options = Options()
    if headless:
        chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.set_page_load_timeout(30)
    return driver

def login_and_fetch_saver(driver: webdriver.Chrome, usuario: str, contrasena: str, timeout: int = 10) -> bool:
    """
    Inicia sesión en el sistema SAVAR con las credenciales proporcionadas.
    
    Args:
        driver: Instancia de Selenium WebDriver
        usuario: Nombre de usuario para el inicio de sesión
        contrasena: Contraseña para el inicio de sesión
        timeout: Tiempo máximo de espera en segundos para los elementos
        
    Returns:
        bool: True si el inicio de sesión fue exitoso, False en caso contrario
    """
    try:
        # Navegar a la página de inicio de sesión
        driver.get("https://ejemplo.savar.com/login")
        
        # Esperar y completar el formulario de inicio de sesión
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.NAME, "username"))
        )
        
        # Limpiar campos y enviar credenciales
        driver.find_element(By.NAME, "username").clear()
        driver.find_element(By.NAME, "username").send_keys(usuario)
        
        driver.find_element(By.NAME, "password").clear()
        driver.find_element(By.NAME, "password").send_keys(contrasena)
        
        # Hacer clic en el botón de inicio de sesión
        driver.find_element(By.CSS_SELECTOR, "input[type='submit']").click()
        
        # Verificar que el inicio de sesión fue exitoso
        try:
            WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.ID, "dashboard"))  # Ajustar según el ID real del dashboard
            )
            print("Inicio de sesión exitoso")
            return True
            
        except TimeoutException:
            # Verificar si hay mensaje de error
            try:
                error_msg = driver.find_element(By.CLASS_NAME, "error-message").text
                print(f"Error en inicio de sesión: {error_msg}")
            except NoSuchElementException:
                print("Error: No se pudo determinar el estado del inicio de sesión")
            return False
            
    except Exception as e:
        print(f"Error durante el inicio de sesión: {str(e)}")
        return False

def extract_data(driver: webdriver.Chrome, timeout: int = 10) -> Dict[str, Any]:
    """
    Extrae datos de la página actual después del inicio de sesión.
    
    Args:
        driver: Instancia de Selenium WebDriver ya autenticada
        timeout: Tiempo máximo de espera en segundos para los elementos
        
    Returns:
        Dict con los datos extraídos estructurados
    """
    try:
        # Navegar a la página que contiene los datos (ajustar URL según sea necesario)
        driver.get("https://ejemplo.savar.com/datos")
        
        # Esperar a que se cargue la tabla de datos
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.contenido-datos table"))
        )
        
        # Extraer datos de la tabla
        tabla = driver.find_element(By.CSS_SELECTOR, "div.contenido-datos table")
        filas = tabla.find_elements(By.TAG_NAME, "tr")
        
        # Procesar encabezados
        encabezados = []
        for th in filas[0].find_elements(By.TAG_NAME, "th"):
            encabezados.append(th.text.strip())
        
        # Procesar filas de datos
        datos = []
        for fila in filas[1:]:  # Saltar la fila de encabezados
            celdas = fila.find_elements(By.TAG_NAME, "td")
            if celdas:  # Asegurarse de que la fila tenga celdas
                fila_datos = {}
                for i, celda in enumerate(celdas):
                    if i < len(encabezados):
                        fila_datos[encabezados[i]] = celda.text.strip()
                datos.append(fila_datos)
        
        return {
            "estado": "éxito",
            "fecha_consulta": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_registros": len(datos),
            "datos": datos
        }
        
    except TimeoutException:
        return {
            "estado": "error",
            "mensaje": "Tiempo de espera agotado al cargar los datos",
            "fecha_consulta": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
    except Exception as e:
        return {
            "estado": "error",
            "mensaje": f"Error al extraer datos: {str(e)}",
            "fecha_consulta": time.strftime("%Y-%m-%d %H:%M:%S")
        }

def save_to_database(data: Dict[str, Any], table_name: str = 'datos_externos') -> Dict[str, Any]:
    """
    Guarda los datos extraídos en la base de datos MySQL.
    
    Args:
        data: Diccionario con los datos a guardar
        table_name: Nombre de la tabla donde se guardarán los datos
        
    Returns:
        Dict con el resultado de la operación
    """
    try:
        # Configuración de la conexión (ajusta según tu configuración)
        connection = mysql.connector.connect(
            host='localhost',
            user='root',  # Cambia por tu usuario de MySQL
            password='',  # Cambia por tu contraseña
            database='hermes_express'  # Asegúrate de que esta base de datos exista
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Crear la tabla si no existe
            create_table_query = f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fecha_consulta DATETIME NOT NULL,
                tipo_dato VARCHAR(50) NOT NULL,
                contenido JSON NOT NULL,
                estado VARCHAR(20) DEFAULT 'pendiente',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """
            cursor.execute(create_table_query)
            
            # Insertar los datos
            insert_query = f"""
            INSERT INTO {table_name} (fecha_consulta, tipo_dato, contenido)
            VALUES (%s, %s, %s)
            """
            
            record = (
                data.get('fecha_consulta', time.strftime("%Y-%m-%d %H:%M:%S")),
                'datos_savar',  # o cualquier otro identificador de tipo de dato
                json.dumps(data, ensure_ascii=False)
            )
            
            cursor.execute(insert_query, record)
            connection.commit()
            
            return {
                'estado': 'éxito',
                'mensaje': 'Datos guardados correctamente en la base de datos',
                'id_registro': cursor.lastrowid,
                'fecha_registro': time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
    except Error as e:
        return {
            'estado': 'error',
            'mensaje': f'Error al guardar en la base de datos: {str(e)}',
            'fecha_error': time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def main():
    """
    Función principal para probar el módulo.
    """
    # Configurar driver
    driver = None
    try:
        print("Iniciando navegador...")
        driver = setup_driver(headless=False)  # Cambiar a True para producción
        
        # Credenciales (en producción, usa variables de entorno o un gestor de secretos)
        USUARIO = "tu_usuario"
        CONTRASENA = "tu_contraseña"
        
        # Iniciar sesión
        if login_and_fetch_saver(driver, USUARIO, CONTRASENA):
            # Extraer datos
            datos = extract_data(driver)
            print("\nDatos extraídos:")
            print(json.dumps(datos, indent=2, ensure_ascii=False))
            
            # Guardar datos en un archivo JSON
            with open('datos_savar.json', 'w', encoding='utf-8') as f:
                json.dump(datos, f, indent=2, ensure_ascii=False)
            print("\nDatos guardados en 'datos_savar.json'")
            
            # Guardar en la base de datos
            if datos.get('estado') == 'éxito':
                resultado_db = save_to_database(datos)
                print("\nResultado de guardado en base de datos:")
                print(json.dumps(resultado_db, indent=2, ensure_ascii=False))
            
    except Exception as e:
        print(f"Error en la ejecución: {str(e)}")
        
    finally:
        # Cerrar el navegador
        if driver:
            print("\nCerrando navegador...")
            driver.quit()

if __name__ == "__main__":
    main()
