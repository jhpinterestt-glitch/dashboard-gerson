// Prevents additional console window on Windows in release, do not remove!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::io::Write;
use rfd::FileDialog;
use base64::{Engine as _, engine::general_purpose};

#[tauri::command]
fn save_file(filename: String, base64_content: String) -> Result<String, String> {
    let bytes = general_purpose::STANDARD
        .decode(base64_content)
        .map_err(|e| format!("Falha ao decodificar Base64: {}", e))?;

    let file_path = FileDialog::new()
        .set_file_name(&filename)
        .save_file();

    if let Some(path) = file_path {
        let mut file = File::create(&path)
            .map_err(|e| format!("Falha ao criar arquivo: {}", e))?;
        file.write_all(&bytes)
            .map_err(|e| format!("Falha ao escrever no arquivo: {}", e))?;
        Ok(path.to_string_lossy().to_string())
    } else {
        Err("Operação cancelada pelo usuário".to_string())
    }
}

fn main() {
    use tauri_plugin_sql::{Migration, MigrationKind};

    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE IF NOT EXISTS processos (
                id TEXT PRIMARY KEY,
                cliente TEXT NOT NULL,
                numero TEXT NOT NULL,
                tribunal TEXT NOT NULL,
                valor REAL NOT NULL,
                status TEXT NOT NULL,
                fase TEXT NOT NULL,
                criadoEm TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS lancamentos (
                id TEXT PRIMARY KEY,
                tipo TEXT NOT NULL,
                descricao TEXT NOT NULL,
                valor REAL NOT NULL,
                data TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS prazos (
                id TEXT PRIMARY KEY,
                titulo TEXT NOT NULL,
                detalhe TEXT NOT NULL,
                data TEXT NOT NULL,
                tipo TEXT NOT NULL,
                processoId TEXT
            );",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:advocacia.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![save_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
