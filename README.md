Cada vez que se realiza un cambio en la base de datos, se debe hacer los respectivos cambios en los archivos de migrations.

Primero, deben de eliminar el archivo: development.sqlite y luego, usar el siguiente comando para formar un nuevo archivo development.sqlite *ACTUALIZADO*: npx sequelize-cli db:migrate
