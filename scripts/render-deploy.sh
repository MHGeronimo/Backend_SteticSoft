#!/bin/bash

# Script de deploy para Render.com
# Este script se ejecuta automáticamente en cada deploy

echo "🚀 Iniciando deploy en Render..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

echo "📦 Instalando dependencias..."
npm install

echo "🔄 Ejecutando migraciones de base de datos..."
npx sequelize-cli db:migrate

# Verificar que las migraciones se ejecutaron correctamente
if [ $? -eq 0 ]; then
    echo "✅ Migraciones ejecutadas exitosamente"
else
    echo "❌ Error ejecutando migraciones"
    exit 1
fi

echo "🔍 Verificando estado de migraciones..."
npx sequelize-cli db:migrate:status

echo "🎯 Iniciando aplicación..."
npm start
