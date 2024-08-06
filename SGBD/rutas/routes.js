const express = require('express');
const router = express.Router();
const db = require('./config/db'); // Asegúrate de que este archivo exporte una instancia de la clase ConnectDatabase

// Ruta principal
router.get('/', (req, res) => {
  res.render('index');
});

// Ruta para mostrar el formulario de crear base de datos
router.get('/crear-base-datos', (req, res) => {
  res.render('crear-base-datos');
});

// Ruta para procesar el formulario de crear base de datos
router.post('/crear-base-datos', async (req, res) => {
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
router.get('/crear-tabla', (req, res) => {
  res.render('crear-tabla');
});

// Ruta para procesar el formulario de crear tabla
router.post('/crear-tabla', async (req, res) => {
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
router.get('/modificar-tabla', (req, res) => {
  res.render('modificar-tabla');
});

// Ruta para procesar el formulario de modificar tabla
router.post('/modificar-tabla', async (req, res) => {
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
router.get('/borrar-tabla', (req, res) => {
  res.render('borrar-tabla');
});

// Ruta para procesar el formulario de borrar tabla
router.post('/borrar-tabla', async (req, res) => {
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
router.get('/insertar-registro', (req, res) => {
  res.render('insertar-registro');
});

// Ruta para procesar el formulario de insertar registro
router.post('/insertar-registro', async (req, res) => {
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
router.get('/borrar-registro', (req, res) => {
  res.render('borrar-registro');
});

// Ruta para procesar el formulario de borrar registro
router.post('/borrar-registro', async (req, res) => {
  const { nombreBaseDatos, nombreTabla, nombreCampo, valorCampo } = req.body;

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
router.get('/actualizar-registro', (req, res) => {
  res.render('actualizar-registro');
});

// Ruta para procesar el formulario de actualizar registro
router.post('/actualizar-registro', async (req, res) => {
  const { nombreBaseDatos, nombreTabla, campo, valor, columnaCondicion, valorCondicion } = req.body;

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

// Ruta para mostrar registros
router.get('/mostrar-registros', async (req, res) => {
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

module.exports = router;
