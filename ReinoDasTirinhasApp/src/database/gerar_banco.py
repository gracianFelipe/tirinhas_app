import sqlite3
import os

# Caminhos dos arquivos
folder = os.path.dirname(os.path.abspath(__file__))
sql_file = os.path.join(folder, 'reino_das_tirinhas.sql')
db_file = os.path.join(folder, 'reino_das_tirinhas.db')

def main():
    if os.path.exists(db_file):
        print(f"Limpando banco antigo: {db_file}")
        os.remove(db_file)

    print(f"Criando novo banco de dados em: {db_file}...")
    
    try:
        # Conecta ao banco (isso cria o arquivo .db vazio)
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()

        # Lê o arquivo SQL
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        # Executa o script SQL
        cursor.executescript(sql_script)
        conn.commit()
        
        print("OK! Banco de dados criado com sucesso com todas as tabelas e sementes!")
        conn.close()
    except Exception as e:
        print(f"Erro ao gerar o banco: {e}")

if __name__ == "__main__":
    main()
