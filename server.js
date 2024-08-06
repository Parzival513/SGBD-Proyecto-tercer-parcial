const express = require('express');
const bodyParser = require('body-parser');
const ConnectDatabase = require('./config/db');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Instanciar la clase ConnectDatabase
const db = new ConnectDatabase();

// Conectar a MySQL
db.connectMySQL().then(() => {
  console.log("Conectado a MySQL");

  // Ruta principal
  app.get('/', (req, res) => {
    res.render('index');
  });

    // Ruta para mostrar el formulario de crear base de datos
  app.get('/crear-base-datos', (req, res) => {
    res.render('crear-base-datos');
  });

  // Ruta para procesar el formulario de crear base de datos
  app.post('/crear-base-datos', async (req, res) => {
    const { nombreBaseDatos } = req.body;
    const sql = `CREATE DATABASE ${nombreBaseDatos}`;
  
    try {
      await db.query(sql);
      console.log(`Base de datos ${nombreBaseDatos} creada exitosamente.`);
      res.json({ success: true, message: `Base de datos ${nombreBaseDatos} creada exitosamente.` });
    } catch (error) {
      console.error(`Error al crear la base de datos ${nombreBaseDatos}: ${error.message}`);
      res.status(500).json({ success: false, message: `Error al crear la base de datos ${nombreBaseDatos}: ${error.message}` });
    }
  });

  // Ruta para mostrar el formulario de crear tabla
  app.get('/crear-tabla', (req, res) => {
    res.render('crear-tabla');
  });

  // Ruta para procesar el formulario de crear tabla
  app.post('/crear-tabla', async (req, res) => {
    const { nombreBaseDatos, nombreTabla, campos } = req.body;
    const definicionesCampos = JSON.parse(campos).map(campo => `${campo.nombre} ${campo.tipo}`).join(', ');
    const sql = `CREATE TABLE ${nombreBaseDatos}.${nombreTabla} (${definicionesCampos})`;
  
    try {
      await db.query(sql);
      res.json({ success: true, message: `Tabla ${nombreTabla} creada en la base de datos ${nombreBaseDatos}` });
    } catch (error) {
      res.status(500).json({ success: false, message: `Error al crear la tabla ${nombreTabla}: ${error.message}` });
    }
  });
  

  // Ruta para mostrar el formulario de modificar tabla
app.get('/modificar-tabla', (req, res) => {
  res.render('modificar-tabla');
});

// Ruta para procesar el formulario de modificar tabla
app.post('/modificar-tabla', async (req, res) => {
  const { nombreBaseDatos, nombreTabla, accion, campo, tipo } = req.body;
  let sql = '';

  if (accion === 'agregar') {
    sql = `ALTER TABLE ${nombreBaseDatos}.${nombreTabla} ADD COLUMN ${campo} ${tipo}`;
  } else if (accion === 'borrar') {
    sql = `ALTER TABLE ${nombreBaseDatos}.${nombreTabla} DROP COLUMN ${campo}`;
  }

  try {
    await db.query(sql);
    res.redirect(`/modificar-tabla?message=Campo ${campo} ${accion} en la tabla ${nombreTabla}&type=success`);
  } catch (error) {
    res.redirect(`/modificar-tabla?message=Error al modificar la tabla ${nombreTabla}: ${error.message}&type=error`);
  }
});

  // Ruta para mostrar el formulario de borrar tabla
app.get('/borrar-tabla', (req, res) => {
  res.render('borrar-tabla');
});

// Ruta para procesar el formulario de borrar tabla
app.post('/borrar-tabla', async (req, res) => {
  const { nombreBaseDatos, nombreTabla } = req.body;
  const sql = `DROP TABLE ${nombreBaseDatos}.${nombreTabla}`;

  try {
    await db.query(sql);
    res.redirect(`/borrar-tabla?message=Tabla ${nombreTabla} borrada con éxito&type=success`);
  } catch (error) {
    res.redirect(`/borrar-tabla?message=Error al borrar la tabla ${nombreTabla}: ${error.message}&type=error`);
  }
});

  // Ruta para mostrar el formulario de insertar registro
app.get('/insertar-registro', (req, res) => {
  res.render('insertar-registro');
});

// Ruta para procesar el formulario de insertar registro
app.post('/insertar-registro', async (req, res) => {
  const { nombreBaseDatos, nombreTabla, registro } = req.body;
  const parsedRegistro = JSON.parse(registro);
  
  const keys = Object.keys(parsedRegistro).join(', ');
  const values = Object.values(parsedRegistro);
  const placeholders = new Array(values.length).fill('?').join(', ');

  const sql = `INSERT INTO ${nombreBaseDatos}.${nombreTabla} (${keys}) VALUES (${placeholders})`;

  try {
    await db.query(sql, values);
    res.redirect(`/insertar-registro?message=Registro insertado en la tabla ${nombreTabla}&type=success`);
  } catch (error) {
    res.redirect(`/insertar-registro?message=Error al insertar registro en la tabla ${nombreTabla}: ${error.message}&type=error`);
  }
});
  
 // Ruta para mostrar el formulario de borrar registro
app.get('/borrar-registro', (req, res) => {
  res.render('borrar-registro');
});

// Ruta para procesar el formulario de borrar registro
app.post('/borrar-registro', async (req, res) => {
  const { nombreBaseDatos, nombreTabla, nombreCampo, valorCampo } = req.body;

  // Validar que todos los campos tengan valores definidos
  if (!nombreBaseDatos || !nombreTabla || !nombreCampo || typeof valorCampo === 'undefined') {
    return res.redirect(`/borrar-registro?message=Todos los campos son obligatorios y deben estar definidos.&type=error`);
  }

  const sql = `DELETE FROM ${nombreBaseDatos}.${nombreTabla} WHERE ${nombreCampo} = ?`;
  const values = [valorCampo];

  try {
    await db.query(sql, values);
    res.redirect(`/borrar-registro?message=Registro con ${nombreCampo} = ${valorCampo} borrado de la tabla ${nombreTabla}&type=success`);
  } catch (error) {
    res.redirect(`/borrar-registro?message=Error al borrar registro de la tabla ${nombreTabla}: ${error.message}&type=error`);
  }
});

  // Ruta para mostrar el formulario de actualizar registro
app.get('/actualizar-registro', (req, res) => {
  res.render('actualizar-registro');
});

// Ruta para procesar el formulario de actualizar registro
app.post('/actualizar-registro', async (req, res) => {
  const { nombreBaseDatos, nombreTabla, campo, valor, columnaCondicion, valorCondicion } = req.body;

  // Validar que todos los campos tengan valores definidos
  if (!nombreBaseDatos || !nombreTabla || !campo || typeof valor === 'undefined' || !columnaCondicion || typeof valorCondicion === 'undefined') {
    return res.redirect(`/actualizar-registro?message=Todos los campos son obligatorios y deben estar definidos.&type=error`);
  }

  const sql = `UPDATE ${nombreBaseDatos}.${nombreTabla} SET ${campo} = ? WHERE ${columnaCondicion} = ?`;
  const values = [valor, valorCondicion];

  try {
    await db.query(sql, values);
    res.redirect(`/actualizar-registro?message=Registro actualizado en la tabla ${nombreTabla}&type=success`);
  } catch (error) {
    res.redirect(`/actualizar-registro?message=Error al actualizar registro en la tabla ${nombreTabla}: ${error.message}&type=error`);
  }
});

// Función para manejar mostrar registros
async function handleMostrarRegistros(req, res) {
  const { nombreBaseDatos } = req.body.nombreBaseDatos || req.query;

  const obtenerTablasSQL = `SHOW TABLES FROM ${nombreBaseDatos}`;

  try {
    const tablas = await db.query(obtenerTablasSQL);
    const tablasConRegistros = [];

    for (const tablaObj of tablas) {
      const tablaNombre = tablaObj[`Tables_in_${nombreBaseDatos}`];
      const sql = `SELECT * FROM ${nombreBaseDatos}.${tablaNombre}`;
      const registros = await db.query(sql);
      tablasConRegistros.push({ nombre: tablaNombre, registros });
    }

    res.render('mostrar-registros', { tablas: tablasConRegistros });
  } catch (error) {
    res.status(500).send(`Error al mostrar registros: ${error.message}`);
  }
}

// Ruta para mostrar registros
app.get('/mostrar-registros', async (req, res) => {
  const { nombreBaseDatos, nombreTabla } = req.query;

  if (!nombreBaseDatos || !nombreTabla) {
    return res.render('mostrar-registros', { mensaje: 'Debe proporcionar el nombre de la base de datos y el nombre de la tabla.' });
  }

  const sql = `SELECT * FROM ${nombreBaseDatos}.${nombreTabla}`;
  
  try {
    const registros = await db.query(sql);
    res.render('mostrar-registros', { registros, nombreTabla });
  } catch (error) {
    res.render('mostrar-registros', { mensaje: `Error al mostrar registros de la tabla ${nombreTabla}: ${error.message}` });
  }
});


  // Iniciar el servidor
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}).catch((error) => {
  console.error("Error al conectar con MySQL: " + error);
});
