const { response } = require('express');
const bcrypt = require('bcryptjs');

const Usuario = require('../models/usuario');
const { generarJWT } = require('../helpers/jwt');

const getUsuarios = async (req, res) => {
  const desde = Number(req.query.desde) || 0;
  const bloque = Number(req.query.bloque) || 5;

  const [usuarios, total] = await Promise.all([
    Usuario.find({}, 'nombre apellidos email rol google img')
      .skip(desde)
      .limit(bloque),

    Usuario.countDocuments(),
  ]);

  res.json({
    ok: true,
    usuarios,
    total,
  });
};

const getAllUsuarios = async (req, res) => {
  const [usuarios, total] = await Promise.all([
    Usuario.find({}, 'nombre apellidos email rol google img'),

    Usuario.countDocuments(),
  ]);

  res.json({
    ok: true,
    usuarios,
    total,
  });
};

const crearUsuario = async (req, res = response) => {
  const { email, password } = req.body;
  const body = req.body;

  try {
    const existeEmail = await Usuario.findOne({ email });

    if (existeEmail) {
      return res.status(400).json({
        ok: false,
        msg: 'El correo ya está registrado',
      });
    }

    // const usuario = new Usuario( req.body );
    const usuario = new Usuario({
      nombre: body.nombre,
      apellidos: body.apellidos,
      email: body.email,
      img: body.img,
      rol: body.rol,
    });

    // Encriptar contraseña
    const salt = bcrypt.genSaltSync();
    usuario.password = bcrypt.hashSync(password, salt);

    // Guardar usuario
    await usuario.save();

    // Generar el TOKEN - JWT
    const token = await generarJWT(usuario.id);

    res.json({
      ok: true,
      usuario,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Error inesperado... revisar logs',
    });
  }
};

// Modificar usuario
const actualizarUsuario = async (req, res = response) => {
  // TODO: Validar token y comprobar si es el usuario correcto

  const uid = req.params.id;

  try {
    const usuarioDB = await Usuario.findById(uid);

    if (!usuarioDB) {
      return res.status(404).json({
        ok: false,
        msg: 'No existe un usuario por ese id',
      });
    }

    // Actualizaciones
    const { password, google, email, ...campos } = req.body;

    if (usuarioDB.email !== email) {
      if (usuarioDB.google) {
        return res.status(400).json({
          ok: false,
          msg: 'Los usuarios de Google no pueden cambiar su correo',
        });
      }

      const existeEmail = await Usuario.findOne({ email });

      if (existeEmail) {
        return res.status(400).json({
          ok: false,
          msg: 'Ya existe un usuario con ese email',
        });
      }
    }

    campos.email = email;

    const usuarioActualizado = await Usuario.findByIdAndUpdate(uid, campos, {
      new: true,
    });

    res.json({
      ok: true,
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Error inesperado',
    });
  }
};

// Borrar Usuario
const borrarUsuario = async (req, res = response) => {
  const uid = req.params.id;

  try {
    const usuarioDB = await Usuario.findById(uid);

    if (!usuarioDB) {
      return res.status(404).json({
        ok: false,
        msg: 'No existe un usuario por ese id',
      });
    }

    console.log(uid);
    console.log(usuarioDB);
    await Usuario.findByIdAndDelete(uid);
    // await Usuario.findOneAndDelete(uid);

    res.json({
      ok: true,
      msg: 'Usuario eliminado',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador',
    });
  }
};

module.exports = {
  getUsuarios,
  getAllUsuarios,
  crearUsuario,
  actualizarUsuario,
  borrarUsuario,
};
