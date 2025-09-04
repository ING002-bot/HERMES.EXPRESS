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
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--disable-plugins')
    chrome_options.add_argument('--disable-images')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--allow-running-insecure-content')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.set_page_load_timeout(60)  # Aumentar timeout
    driver.implicitly_wait(10)
    return driver

def login_and_fetch_saver(driver: webdriver.Chrome, usuario: str, contrasena: str, fecha_inicio: str = None, fecha_fin: str = None, timeout: int = 10) -> bool:
    """
    Inicia sesión en el sistema SAVAR con las credenciales proporcionadas.
    
    Args:
        driver: Instancia de Selenium WebDriver
        usuario: Nombre de usuario para el inicio de sesión
        contrasena: Contraseña para el inicio de sesión
        fecha_inicio: Fecha de inicio en formato YYYY-MM-DD (opcional)
        fecha_fin: Fecha de fin en formato YYYY-MM-DD (opcional)
        timeout: Tiempo máximo de espera en segundos para los elementos
        
    Returns:
        bool: True si el inicio de sesión fue exitoso, False en caso contrario
    """
    try:
        # Navegar a la página de inicio de sesión
        driver.get("https://app.savarexpress.com.pe/sso/Inicio/")
        
        # Esperar a que la página se cargue completamente
        time.sleep(5)
        
        print("Buscando campos de login...")
        
        # Buscar campos de forma directa
        try:
            username_field = driver.find_element(By.CSS_SELECTOR, "input[type='text']")
            print("Campo de usuario encontrado")
        except NoSuchElementException:
            print("No se encontró campo de usuario")
            return False
            
        try:
            password_field = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
            print("Campo de contraseña encontrado")
        except NoSuchElementException:
            print("No se encontró campo de contraseña")
            return False
        
        print(f"Completando credenciales: {usuario}")
        
        # Completar los campos
        username_field.clear()
        username_field.send_keys(usuario)
        
        password_field.clear()
        password_field.send_keys(contrasena)
        
        # Buscar y hacer clic en el botón de envío
        try:
            submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            print("Botón de envío encontrado, haciendo clic...")
            submit_button.click()
            
            # Esperar a que se complete el inicio de sesión
            time.sleep(5)
            
            # Verificar si el inicio de sesión fue exitoso
            current_url = driver.current_url
            print(f"URL actual: {current_url}")
            
            # Si se proporcionaron fechas, intentar configurarlas
            if fecha_inicio and fecha_fin:
                try:
                    print(f"Configurando rango de fechas: {fecha_inicio} a {fecha_fin}")
                    
                    # Intentar diferentes selectores para los campos de fecha
                    date_selectors = [
                        "input[type='date']",
                        "input[data-role='datepicker']",
                        "input[class*='date']",
                        "input[id*='fecha']",
                        "input[name*='fecha']"
                    ]
                    
                    fecha_encontrada = False
                    for selector in date_selectors:
                        try:
                            fecha_inputs = driver.find_elements(By.CSS_SELECTOR, selector)
                            if len(fecha_inputs) >= 2:  # Asumimos que hay al menos 2 campos de fecha
                                # Establecer fecha de inicio
                                driver.execute_script(
                                    f"arguments[0].value = '{fecha_inicio}'", 
                                    fecha_inputs[0]
                                )
                                print(f"Fecha inicio establecida: {fecha_inicio}")
                                
                                # Establecer fecha fin
                                driver.execute_script(
                                    f"arguments[0].value = '{fecha_fin}'", 
                                    fecha_inputs[1]
                                )
                                print(f"Fecha fin establecida: {fecha_fin}")
                                
                                # Buscar y hacer clic en el botón de búsqueda
                                buscar_selectors = [
                                    "button[type='submit']",
                                    "button:contains('Buscar')",
                                    "button:contains('Consultar')",
                                    "input[type='submit'][value='Buscar']"
                                ]
                                
                                for btn_selector in buscar_selectors:
                                    try:
                                        btn = WebDriverWait(driver, 5).until(
                                            EC.presence_of_element_located((By.CSS_SELECTOR, btn_selector))
                                        )
                                        btn.click()
                                        print("Botón de búsqueda clickeado")
                                        time.sleep(3)  # Esperar a que se carguen los resultados
                                        break
                                    except Exception:
                                        continue
                                
                                fecha_encontrada = True
                                break
                                
                        except Exception as e:
                            print(f"Error al configurar fechas: {e}")
                            continue
                    
                    if not fecha_encontrada:
                        print("No se encontraron campos de fecha válidos")
                        
                except Exception as e:
                    print(f"Error al configurar fechas: {e}")
                    # Continuar aunque falle la configuración de fechas
            
            # Verificar si hay mensajes de error
            try:
                error_element = driver.find_element(By.XPATH, "//div[contains(text(), 'Error') or contains(text(), 'Incorrecto') or contains(@class, 'error')]")
                if error_element.is_displayed():
                    print(f"Error en inicio de sesión: {error_element.text}")
                    return False
            except NoSuchElementException:
                pass
                
            # Si llegamos aquí, asumimos que el login fue exitoso
            print("Login procesado - continuando...")
            return True
            
        except NoSuchElementException as e:
            print(f"No se pudo encontrar el botón de envío: {e}")
            print("Intentando enviar con Enter...")
            try:
                password_field.send_keys("\n")
                time.sleep(3)  # Esperar a que se procese el envío
                return True
            except Exception as e:
                print(f"Error al enviar con Enter: {e}")
                return False
                
    except Exception as e:
        print(f"Error durante el inicio de sesión: {str(e)}")
        return False
            
    # Verificar si hay mensajes de error
    try:
        error_element = driver.find_element(By.XPATH, "//div[contains(text(), 'Error') or contains(text(), 'Incorrecto') or contains(@class, 'error')]")
        if error_element.is_displayed():
            print(f"Error en inicio de sesión: {error_element.text}")
            return False
    except NoSuchElementException:
        pass
        
    # Si llegamos aquí, asumimos que el login fue exitoso
    print("Login procesado - continuando...")
    return True

def extract_data(driver: webdriver.Chrome, timeout: int = 10) -> Dict[str, Any]:
    """
    Extrae datos de la página actual después del inicio de sesión, incluyendo tablas en modales.
    
    Args:
        driver: Instancia de Selenium WebDriver ya autenticada
        timeout: Tiempo máximo de espera en segundos para los elementos
        
    Returns:
        Dict con los datos extraídos estructurados
    """
    try:
        current_url = driver.current_url
        print(f"Extrayendo datos desde: {current_url}")
        
        # Esperar a que la página se cargue completamente
        time.sleep(5)
        
        # Intentar cerrar cualquier popup o notificación que pueda estar bloqueando
        try:
            popup_selectors = [
                "button[aria-label='Cerrar']",
                ".close",
                "[data-dismiss='modal']",
                "button:contains('Cerrar')",
                "button:contains('Aceptar')"
            ]
            
            for selector in popup_selectors:
                try:
                    close_buttons = driver.find_elements(By.CSS_SELECTOR, selector)
                    for btn in close_buttons:
                        if btn.is_displayed():
                            driver.execute_script("arguments[0].click();", btn)
                            print(f"Popup cerrado usando selector: {selector}")
                            time.sleep(1)
                except Exception as e:
                    continue
                    
        except Exception as e:
            print(f"Error al intentar cerrar popups: {e}")
        
        # Intentar encontrar y manejar el modal primero
        try:
            print("Buscando modal...")
            
            # Primero, buscar el modal en sí
            modal_container_selectors = [
                ".modal-dialog .modal-content",
                ".modal-body",
                "[role='dialog']",
                ".MuiDialog-container",
                "div[class*='modal']",
                "div[class*='dialog']",
                "div[role='dialog']"
            ]
            
            modal = None
            for selector in modal_container_selectors:
                try:
                    # Esperar a que el modal sea visible
                    modal = WebDriverWait(driver, 10).until(
                        EC.visibility_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    print(f"Modal encontrado con selector: {selector}")
                    
                    # Hacer scroll al modal para asegurar que es visible
                    driver.execute_script("arguments[0].scrollIntoView(true);", modal)
                    time.sleep(1)  # Esperar a que termine el scroll
                    
                    # Tomar captura de pantalla del modal
                    try:
                        modal.screenshot("modal_encontrado.png")
                        print("Captura del modal guardada como 'modal_encontrado.png'")
                    except Exception as e:
                        print(f"No se pudo guardar captura del modal: {e}")
                    
                    break
                except (NoSuchElementException, TimeoutException):
                    continue
            
            # Si encontramos el modal, buscar la tabla dentro de él
            if modal:
                print("Buscando tabla dentro del modal...")
                table_selectors = [
                    "table",
                    ".table",
                    "[role='grid']",
                    ".data-table",
                    "div[class*='table']"
                ]
                
                for selector in table_selectors:
                    try:
                        tabla = modal.find_element(By.CSS_SELECTOR, selector)
                        print(f"Tabla encontrada dentro del modal con selector: {selector}")
                        
                        # Hacer scroll a la tabla
                        driver.execute_script("arguments[0].scrollIntoView(true);", tabla)
                        time.sleep(1)  # Esperar a que termine el scroll
                        
                        # Tomar captura de pantalla de la tabla
                        try:
                            tabla.screenshot("tabla_en_modal.png")
                            print("Captura de la tabla guardada como 'tabla_en_modal.png'")
                        except Exception as e:
                            print(f"No se pudo guardar captura de la tabla: {e}")
                            
                        break
                    except NoSuchElementException:
                        continue
                else:
                    print("No se encontró tabla dentro del modal")
                    tabla = None
                    
                    # Si no se encuentra la tabla, intentar obtener el contenido del modal
                    try:
                        modal_text = modal.text
                        print("Contenido del modal:", modal_text[:500] + "..." if len(modal_text) > 500 else modal_text)
                    except Exception as e:
                        print(f"No se pudo obtener el texto del modal: {e}")
            else:
                print("No se encontró el modal")
                tabla = None
                
        except Exception as e:
            print(f"Error buscando modal: {e}")
            tabla = None
        
        # Si no se encontró tabla en el modal, buscar en la página principal
        if not tabla:
            print("Buscando tabla en la página principal...")
            table_selectors = [
                "table",
                ".table",
                "[role='table']",
                ".data-table",
                ".grid",
                ".datatable",
                "div table",
                ".content table"
            ]
            
            for selector in table_selectors:
                try:
                    tabla = driver.find_element(By.CSS_SELECTOR, selector)
                    print(f"Tabla encontrada con selector: {selector}")
                    break
                except NoSuchElementException:
                    continue
        
        if not tabla:
            # Si no hay tablas, buscar cualquier contenido estructurado
            print("No se encontraron tablas, buscando contenido alternativo...")
            try:
                # Tomar captura de pantalla para depuración
                driver.save_screenshot("debug_screenshot.png")
                print("Captura de pantalla guardada como debug_screenshot.png")
                
                # Buscar divs con datos
                data_containers = driver.find_elements(By.CSS_SELECTOR, 
                    "div[class*='data'], div[class*='content'], div[class*='info'], "
                    "div[class*='row'], div[class*='card'], div[class*='panel']"
                )
                
                if data_containers:
                    print(f"Encontrados {len(data_containers)} contenedores de datos")
                    return {
                        "estado": "éxito",
                        "fecha_consulta": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "tipo_contenido": "contenedores_datos",
                        "total_elementos": len(data_containers),
                        "datos": [{"elemento": i, "texto": elem.text[:200]} for i, elem in enumerate(data_containers[:10])]
                    }
            except Exception as e:
                print(f"Error buscando contenido alternativo: {e}")
            
            return {
                "estado": "error",
                "mensaje": "No se encontraron tablas o contenido de datos",
                "fecha_consulta": time.strftime("%Y-%m-%d %H:%M:%S"),
                "url_origen": current_url
            }
        
        # Si encontramos una tabla, extraer sus datos
        try:
            print("Procesando tabla encontrada...")
            
            # Obtener encabezados de la tabla
            encabezados = []
            try:
                # Intentar obtener los encabezados de las etiquetas th
                th_elements = tabla.find_elements(By.TAG_NAME, "th")
                if th_elements:
                    encabezados = [th.text.strip() for th in th_elements if th.text.strip()]
                
                # Si no hay th, buscar en la primera fila de td
                if not encabezados:
                    primera_fila = tabla.find_element(By.TAG_NAME, "tr")
                    celdas = primera_fila.find_elements(By.TAG_NAME, "td")
                    if celdas:
                        encabezados = [f"Columna_{i+1}" for i in range(len(celdas))]
            except Exception as e:
                print(f"Error extrayendo encabezados: {e}")
                encabezados = ["Columna_1", "Columna_2"]  # Valores por defecto
            
            # Obtener filas de datos
            filas = tabla.find_elements(By.TAG_NAME, "tr")
            datos = []
            
            # Si hay encabezados, saltar la primera fila (asumiendo que es la fila de encabezado)
            start_idx = 1 if encabezados and len(encabezados) > 1 else 0
            
            for i in range(start_idx, len(filas)):
                try:
                    celdas = filas[i].find_elements(By.TAG_NAME, "td")
                    if celdas:  # Solo procesar filas con celdas
                        fila_data = {}
                        for j, celda in enumerate(celdas):
                            nombre_col = encabezados[j] if j < len(encabezados) else f"Columna_{j+1}"
                            fila_data[nombre_col] = celda.text.strip()
                        datos.append(fila_data)
                except Exception as e:
                    print(f"Error procesando fila {i}: {e}")
            
            print(f"Se extrajeron {len(datos)} filas de datos")
            
            # Tomar captura de pantalla de la tabla
            try:
                tabla.screenshot("tabla_encontrada.png")
                print("Captura de pantalla de la tabla guardada como 'tabla_encontrada.png'")
            except Exception as e:
                print(f"No se pudo guardar captura de pantalla: {e}")
            
            return {
                "estado": "éxito",
                "fecha_consulta": time.strftime("%Y-%m-%d %H:%M:%S"),
                "url_origen": current_url,
                "total_registros": len(datos),
                "encabezados": encabezados,
                "datos": datos
            }
            
        except Exception as e:
            print(f"Error procesando la tabla: {e}")
            # Tomar captura de pantalla para depuración
            try:
                driver.save_screenshot("error_tabla.png")
                print("Captura de error guardada como 'error_tabla.png'")
            except:
                pass
                
            return {
                "estado": "error",
                "mensaje": f"Error al procesar la tabla: {str(e)}",
                "fecha_consulta": time.strftime("%Y-%m-%d %H:%M:%S"),
                "url_origen": current_url
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
    connection = None
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
    print("=== PRUEBA DE EXTRACCIÓN DE DATOS SAVAR EXPRESS ===")
    
    # Configurar el navegador
    driver = setup_driver(headless=False)  # Cambiar a True para modo sin cabeza
    
    try:
        # Credenciales de prueba
        usuario = "CHI.HER"
        contrasena = "10111222331"
        
        # Definir fechas para la consulta (formato: YYYY-MM-DD)
        fecha_inicio = "2025-09-01"  # 1 de septiembre de 2025
        fecha_fin = "2025-09-01"     # Misma fecha para un solo día
        
        print(f"\nConfigurando consulta para el rango de fechas: {fecha_inicio} al {fecha_fin}")
        
        # Iniciar sesión y configurar fechas
        if login_and_fetch_saver(driver, usuario, contrasena, fecha_inicio, fecha_fin):
            print("\nInicio de sesión exitoso. Extrayendo datos...")
            
            # Extraer datos
            datos = extract_data(driver)
            
            # Mostrar resultados
            print("\nResultados de la extracción:")
            print(f"Estado: {datos.get('estado')}")
            print(f"Mensaje: {datos.get('mensaje', 'N/A')}")
            print(f"Total de registros: {datos.get('total_registros', 0)}")
            
            # Guardar los datos en un archivo JSON
            with open('datos_savar.json', 'w', encoding='utf-8') as f:
                json.dump(datos, f, ensure_ascii=False, indent=2)
            print("\nDatos guardados en 'datos_savar.json'")
            
            # Si hay datos, intentar guardar en la base de datos
            if datos.get('estado') == 'éxito' and datos.get('datos'):
                print("\nGuardando datos en la base de datos...")
                resultado_db = save_to_database(datos)
                print(f"Resultado de la base de datos: {resultado_db.get('estado')}")
                print(f"Mensaje: {resultado_db.get('mensaje')}")
        else:
            print("\nError: No se pudo iniciar sesión")
            
    except Exception as e:
        print(f"\nError durante la ejecución: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Cerrar el navegador
        input("\nPresiona Enter para cerrar el navegador...")
        driver.quit()

if __name__ == "__main__":
    main()
