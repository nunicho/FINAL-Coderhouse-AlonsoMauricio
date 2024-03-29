const entornoConfig = require("./entorno.config.js");
const passport = require("passport");
const local = require("passport-local");
const github = require("passport-github2");


const util = require("../util.js");

const usersController = require("../controllers/users.controller.js");
const carritosController = require("../controllers/carritos.controller.js");

const inicializaPassport = () => {
  passport.use(
    "registro",
    new local.Strategy(
      {
        usernameField: "email",
        passReqToCallback: true,
      },
      async (req, username, password, done) => {
        try {
          let { first_name, last_name, email, age, role } = req.body;

          if (!first_name || !last_name || !age || !email || !password) {
            return done(null, false, {
              message: "Por favor, complete todos los campos",
            });
          }

          age = parseInt(age);
          if (isNaN(age) || age <= 13 || age >= 120) {
            return done(null, false, {
              message: "La edad debe ser mayor a 13 y menor a 120",
            });
          }

          let existe = await usersController.getUserByEmail(email);
          if (existe) {
            return done(null, false, {
              message: "El correo electrónico ya está registrado",
            });
          }

          const cartId = await carritosController.createEmptyCart();

          let usuario = await usersController.createUser({
            first_name,
            last_name,
            email,
            age,
            password,
            cart: cartId,
            role,
          });
    
          usuario.last_connection = new Date();
          await usuario.save();

          return done(null, usuario);
        } catch (error) {
          return done(error, false, {
            message: "Ocurrió un error durante el registro.",
          });
        }
      }
    )
  );
  passport.use(
    "loginLocal",
    new local.Strategy(
      {
        usernameField: "email",
      },
      async (username, password, done) => {
        try {
          if (!username || !password) {
            return done(null, false, {
              message: "Faltan datos",
              detalle: "Contacte a RRHH",
            });
          }

          let usuario = await usersController.getUserByEmail(username);
          if (!usuario) {
            return done(null, false, {
              message: "Credenciales incorrectas",
              detalle: "Vuelva a ingresar los datos",
            });
          } else {
            if (!util.validaHash(usuario, password)) {
              return done(null, false, {
                message: "Clave inválida",
                detalle: "Vuelva a ingresar los datos",
              });
            }
          }

          usuario.last_connection = new Date();
          await usuario.save();

          usuario = {
            first_name : usuario.first_name,
            email: usuario.email,
            _id: usuario._id,
            role: usuario.role,
            last_connection: usuario.last_connection,
          };

          return done(null, usuario);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  passport.use(
    "loginGithub",
    new github.Strategy(
      {
        clientID: entornoConfig.CLIENT_ID,
        clientSecret: entornoConfig.CLIENT_SECRECT,
        callbackURL: entornoConfig.CALLBACK_URL,
      },
      async (token, tokenRefresh, profile, done) => {
        try {          
          let usuario = await usersController.getUserByGithubEmail(profile._json.email);
          if (!usuario) {
            const cartId = await carritosController.createEmptyCart();
            usuario = await usersController.createUserFromGithub({
              first_name: profile._json.name,
              last_name: profile._json.name,
              email: profile._json.email,
              age: 99,
              github: profile,
              cart: cartId,
              role: "user",
            });
          }

          usuario.last_connection = new Date();
          await usuario.save();

                usuario = {
                  first_name: usuario.first_name,
                  email: usuario.email,
                  _id: usuario._id,
                  role: usuario.role,
                  last_connection: usuario.last_connection,
                };


          done(null, usuario);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((usuario, done) => {
    return done(null, usuario._id);
  });

  passport.deserializeUser(async (id, done) => {
    let usuario = await usersController.getUserByIdGithub(id);
    return done(null, usuario);
  });
};

module.exports = inicializaPassport;
