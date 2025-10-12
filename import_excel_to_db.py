import os
import json
from pathlib import Path
from typing import List, Dict, Any
import hashlib

import pandas as pd
import mysql.connector as mysql

# Config DB via variables de entorno
DB_HOST = os.environ.get('DB_HOST', '127.0.0.1')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASS = os.environ.get('DB_PASS', '')
DB_NAME = os.environ.get('DB_NAME', 'hermes_express')
TABLE_NAME = os.environ.get('PAQUETES_TABLE', 'paquetes_json')
DOWNLOADS_DIR = Path(__file__).parent / 'downloads'


def find_all_excels(downloads: Path) -> List[Path]:
    """Retorna todos los .xls y .xlsx en la carpeta downloads, ordenados por fecha (más recientes primero)."""
    files = sorted(list(downloads.glob('*.xls*')), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        raise FileNotFoundError('No se encontraron archivos Excel en downloads/')
    return files


def read_excel_rows(path: Path) -> List[Dict[str, Any]]:
    """Lee la primera hoja del Excel y devuelve filas como dict, con metadatos de archivo y hoja."""
    # Leer primera hoja completa (todo como texto para no perder formatos)
    df = pd.read_excel(path, sheet_name=0, dtype=str)
    df = df.fillna('')
    rows = df.to_dict(orient='records')
    hoja = 0
    for r in rows:
        # Metadatos útiles para trazabilidad
        r.setdefault('_archivo', path.name)
        r.setdefault('_hoja', hoja)
    return rows


def connect_db():
    cnx = mysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        autocommit=False,
    )
    return cnx


def ensure_table(cursor):
    cursor.execute(
        f"""
        CREATE TABLE IF NOT EXISTS `{TABLE_NAME}` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `data` JSON NOT NULL,
            `hash` VARCHAR(64) NOT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_hash` (`hash`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    # Si la tabla ya existía sin columna hash, intentar agregarla (idempotente)
    try:
        cursor.execute(f"ALTER TABLE `{TABLE_NAME}` ADD COLUMN IF NOT EXISTS `hash` VARCHAR(64) NOT NULL AFTER `data`;")
    except Exception:
        pass
    try:
        cursor.execute(f"ALTER TABLE `{TABLE_NAME}` ADD UNIQUE KEY `uniq_hash` (`hash`);")
    except Exception:
        pass


def insert_rows(rows: List[Dict[str, Any]]) -> int:
    if not rows:
        return 0
    cnx = connect_db()
    try:
        cur = cnx.cursor()
        ensure_table(cur)
        # Inserción con IGNORE y hash único para evitar duplicados
        sql = f"INSERT IGNORE INTO `{TABLE_NAME}` (`data`, `hash`) VALUES (%s, %s)"
        payload = []
        for r in rows:
            # Normalizar JSON con sort_keys para hash estable
            normalized = json.dumps(r, ensure_ascii=False, sort_keys=True)
            h = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
            payload.append((json.dumps(r, ensure_ascii=False), h))
        cur.executemany(sql, payload)
        inserted = cur.rowcount
        cnx.commit()
        return inserted
    finally:
        try:
            cur.close()
        except Exception:
            pass
        cnx.close()


def main():
    try:
        downloads = DOWNLOADS_DIR
        downloads.mkdir(parents=True, exist_ok=True)
        files = find_all_excels(downloads)
        total_insertados = 0
        procesados = []
        for excel in files:
            try:
                rows = read_excel_rows(excel)
                inserted = insert_rows(rows)
                total_insertados += inserted
                procesados.append({'archivo': excel.name, 'insertados': inserted})
            except Exception as e:
                procesados.append({'archivo': excel.name, 'error': str(e)})

        result = {
            'exito': True,
            'mensaje': f'Importación completada de {len(files)} archivo(s) desde downloads/',
            'insertados': total_insertados,
            'detalle': procesados,
        }
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as e:
        print(json.dumps({'exito': False, 'mensaje': str(e)}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
