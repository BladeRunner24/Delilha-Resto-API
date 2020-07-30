/*DEPENDENCIAS*/

const express = require('express');
const app = express();

const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://root:avalokitesvara01@localhost:3306/delilha');

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const moment = require('moment')

const jwt = require('jsonwebtoken');
const firmaSeguraAdm = 'Fenix2023';
const firmaSeguraUser = 'Delos2276';

/*LOGIN*/

app.post('/delilha/login', (req, res) => {
    const {username, userpassword} = req.body;
    sequelize.query('SELECT usuario, user_password, tipo_acceso FROM usuarios',
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(verificarAcceso){
        const accesoAdm = verificarAcceso.find(userA => userA.usuario == username && userA.user_password == userpassword && userA.tipo_acceso == 1);
        const accesoUser = verificarAcceso.find(userU => userU.usuario == username && userU.user_password == userpassword && userU.tipo_acceso == 2); 
          
        if(accesoAdm != undefined) {
            const token1 = jwt.sign({
                username}, firmaSeguraAdm);

            res.status(200).json({token1});
        }else if (accesoUser != undefined) {
            const token2 = jwt.sign({
                username}, firmaSeguraUser);

            res.status(200).json({token2});
        }else {
            res.status(400).send('El usuario o password es incorrecto')
        }
    }).catch(function(error){
        res.send(error)
    });
});

/*MIDDLEWARES CON LOS PERMISOS DE ACCESO USUARIO/ADMINISTRADOR*/

const autorizacionAdm = (req, res, next) => {
    try {
    const token1 = req.headers.authorization.split(' ')[1];
    const verificarToken1 = jwt.verify(token1, firmaSeguraAdm);
        if (verificarToken1) {
            req.username = verificarToken1;
            return next();
        }
        } catch (error) {
            res.send('El usuario no pudo ser verificado')
        }    
}; 

const autorizacionUser = (req, res, next) => {
    try {
    const token2 = req.headers.authorization.split(' ')[1];
    const verificarToken2 = jwt.verify(token2, firmaSeguraUser);
        if (verificarToken2) {
            req.username = verificarToken2;
            return next();
        }
        }catch (error) {
            res.send('El usuario no pudo ser verificado')
        }    
};

/*NUEVO USUARIO (ACCESO ABIERTO)*/

app.post('/delilha/nuevousuario', (req, res) => {
    const{usuario, nombreYApellido, correoElectronico, telefono, direccion, password} = req.body
    sequelize.query(`INSERT INTO usuarios VALUES (NULL, '${usuario}', '${nombreYApellido}', '${correoElectronico}', '${telefono}', '${direccion}', '${password}', 2)`,
    ).then(function(nuevoUsuario) {
        nuevoUsuario.push()
        res.status(201).send('Usuario creado!');
    }).catch(function(error){
        res.status(400).send('El usuario no pudo ser creado correctamente')
    });    

});

/*ACCESOS DEFINIDOS PARA EL ROL DE USUARIO*/

/* VISTA USUARIO (SOLO AL USUARIO QUE INGRESO), MODIFICACION DE USUARIO, VISTA MENU, VISTA PLATO,....*/

/* VISTA USUARIO (SOLO INFORMACION DEL USUARIO LOGUEADO)*/

app.get('/delilha/vistausuario/:usuario', autorizacionUser, (req, res) => {
    const vistaUsuario = req.params.usuario;
    const token2 = req.headers.authorization.split(' ')[1];
    const verificarToken2 = jwt.verify(token2, firmaSeguraUser);

    sequelize.query(`SELECT * FROM usuarios WHERE usuario = '${vistaUsuario}'`,
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(vUsuario) {
        if(vistaUsuario == verificarToken2.username) {          
        res.status(200).send(vUsuario)
        }else{
            res.status(401).send('No tiene acceso a la informacion de otros usuarios')
        }
    }).catch(function(error){
        res.status(400).send(error)
    });
});

/* MODIFICACION USUARIO (SOLO INFORMACION DEL USUARIO LOGUEADO)*/

app.put('/delilha/modusuario', autorizacionUser, (req, res) => {
    
    const {nombreYApellido, correoElectronico, telefono, direccion, password} = req.body
    const token2 = req.headers.authorization.split(' ')[1];
    const verificarToken2 = jwt.verify(token2, firmaSeguraUser);
    const usuarioAModificar = verificarToken2.username;

    sequelize.query(`UPDATE usuarios SET nombreyapellido = '${nombreYApellido}', correo_electronico = '${correoElectronico}', telefono = '${telefono}', direccion_envio = '${direccion}', user_password = '${password}' WHERE usuario = '${usuarioAModificar}'`,
    ).then(function(modificacionPlato) {
        console.log(modificacionPlato)
        res.status(200).send('Su usuario a sido modificado!');
    }).catch(function(error){
        res.status(400).send('La modificacion no pudo realizarse');
    });
})

/*VISTA MENU USUARIO*/

app.get('/delilha/usuariovistamenu', autorizacionUser, (req, res) => {
    sequelize.query('SELECT * FROM menu_delilha', 
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(menu){
        res.status(200).send(menu)
    }).catch(function(error){
        res.status(400).send(error)
    });    
});

/*BUSQUEDA ESPECIFICA DE PRODUCTOS*/

app.get('/delilha/usuariovistamenu/:plato', autorizacionUser, (req, res) => {
    const plato = req.params.plato;
    sequelize.query('SELECT nombre_plato, precio FROM menu_delilha', 
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(menu){
        let plato1 = menu.find(platos => platos.nombre_plato == plato);
        if (plato1 != undefined){
        res.status(200).send(plato1)
        }else{
         res.status(404).send('El plato no existe')   
        };        
    }).catch(function(error){
        res.status(400).send(error)
    });    
});


/*CREACION DE PEDIDOS*/

app.post('/delilha/pedidos', autorizacionUser, (req, res) => {
    const{plato1, cantidad1, plato2, cantidad2, plato3, cantidad3, plato4, cantidad4, plato5, cantidad5, modopago} = req.body;
    const token2 = req.headers.authorization.split(' ')[1];
    const verificarToken2 = jwt.verify(token2, firmaSeguraUser);
    const usuarioPedido = verificarToken2.username;
    const estado = 1;
    let m = moment()
    let hora = m.set({hour:0,minute:0,second:0});
    let numeroPedido = Math.floor (Math.random() * 101) + '-' + Math.floor (Math.random() * 101);  
      
    sequelize.query(`INSERT INTO pedidos (id_pedidos, estado, hora, codigo_pedido, plato, cantidad, modo_pago, usuario) VALUES (NULL, ${estado}, '${hora}', '${numeroPedido}', ${plato1}, ${cantidad1}, ${modopago}, '${usuarioPedido}'), (NULL, ${estado}, '${hora}', '${numeroPedido}', ${plato2}, ${cantidad2}, ${modopago}, '${usuarioPedido}'), (NULL, ${estado}, '${hora}', '${numeroPedido}', ${plato3}, ${cantidad3}, ${modopago}, '${usuarioPedido}'), (NULL, ${estado}, '${hora}', '${numeroPedido}', ${plato4}, ${cantidad4}, ${modopago}, '${usuarioPedido}'), (NULL, ${estado}, '${hora}', '${numeroPedido}', ${plato5}, ${cantidad5}, ${modopago}, '${usuarioPedido}')`,
    ).then(function(ingresoPedido) {
        console.log(ingresoPedido)
        res.status(201).send('Su pedido a sido ingresado!');
    }).catch(function(error){
        res.status(400).send('Su pedido no pudo ser ingresado');
    });
});

/*VISTA DE TODOS LOS PEDIDOS (USUARIO)*/

app.get('/delilha/vistapedidos', autorizacionUser, (req, res) => {
    const token2 = req.headers.authorization.split(' ')[1];
    const verificarToken2 = jwt.verify(token2, firmaSeguraUser);
    const usuarioPedido = verificarToken2.username;
    sequelize.query(`SELECT pedidos.estado, pedidos.hora, pedidos.codigo_pedido, pedidos.cantidad, pedidos.usuario, menu_delilha.nombre_plato, menu_delilha.precio, estados.estado, forma_de_pago.forma_de_pago, usuarios.nombreyapellido, usuarios.direccion_envio, pedidos.cantidad*menu_delilha.precio AS precio_total FROM pedidos JOIN menu_delilha ON pedidos.plato = menu_delilha.id_plato JOIN estados ON pedidos.estado = estados.id_estados JOIN forma_de_pago ON pedidos.modo_pago = forma_de_pago.id_forma_de_pago JOIN usuarios ON pedidos.usuario = usuarios.usuario`,
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(listaPedidos){
        let accesoUsuario = listaPedidos.filter(usuarioU => usuarioU.usuario == usuarioPedido);
        res.status(200).send(accesoUsuario)
        
    }).catch(function(error){
        res.status(400).send(error)
    });    
});

/*VISTA DE PEDIDO ESPECIFICO (USUARIO)*/

app.get('/delilha/vistapedidos/:pedido', autorizacionUser, (req, res) => {
    const pedidoBuscado =  req.params.pedido;
    const token2 = req.headers.authorization.split(' ')[1];
    const verificarToken2 = jwt.verify(token2, firmaSeguraUser);
    const usuarioPedido = verificarToken2.username;
    sequelize.query(`SELECT pedidos.estado, pedidos.hora, pedidos.codigo_pedido, pedidos.cantidad, pedidos.usuario, menu_delilha.nombre_plato, menu_delilha.precio, estados.estado, forma_de_pago.forma_de_pago, usuarios.nombreyapellido, usuarios.direccion_envio, pedidos.cantidad*menu_delilha.precio AS precio_total FROM pedidos JOIN menu_delilha ON pedidos.plato = menu_delilha.id_plato JOIN estados ON pedidos.estado = estados.id_estados JOIN forma_de_pago ON pedidos.modo_pago = forma_de_pago.id_forma_de_pago JOIN usuarios ON pedidos.usuario = usuarios.usuario`,
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(listaPedidos){
        let accesoUsuario = listaPedidos.filter(usuarioU => usuarioU.usuario == usuarioPedido && usuarioU.codigo_pedido == pedidoBuscado);
        res.status(200).send(accesoUsuario)        
    }).catch(function(error){
        res.status(400).send('El pedido no existe o a sucedido un error');
    });    
});


/*ACCESOS DEFINIDOS PARA EL ROL DE ADMINISTRADOR*/

/* VISTA USUARIOS (TODOS), VISTA ESPECIFICA DE USUARIOS, MODIFICACION DE ROL USUARIO, BORRADO DE USUARIOS, VISTA PRODUCTOS, VISTA ESPECIFICA PRODUCTOS, MODIFICACION PRODUCTOS, BORRADO DE PRODUCTOS, CREACION DE PRODUCTOS*/

/* VISTA USUARIO ADMINISTRADOR (SOLO INFORMACION DEL ADMINISTRADOR LOGUEADO)*/

app.get('/delilha/vistaadm/:usuario', autorizacionAdm, (req, res) => {
    const vistaUsuario = req.params.usuario;
    const token2 = req.headers.authorization.split(' ')[1];
    const verificarToken2 = jwt.verify(token2, firmaSeguraAdm);

    sequelize.query(`SELECT * FROM usuarios WHERE usuario = '${vistaUsuario}'`,
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(vUsuario) {
        if(vistaUsuario == verificarToken2.username) {          
        res.status(200).send(vUsuario)
        }else{
            res.status(401).send('Desde esta pantalla solo tiene acceso a su informacion');
        }
    }).catch(function(error){
        res.status(400).send(error)
    });
});

/* MODIFICACION PERFIL ADMINISTRADOR (SOLO INFORMACION DEL ADMINISTRADOR LOGUEADO)*/

app.put('/delilha/modificaradministrador', autorizacionAdm, (req, res) => {
    
    const {nombreYApellido, correoElectronico, telefono, direccion, password} = req.body
    const token2 = req.headers.authorization.split(' ')[1];
    const verificarToken2 = jwt.verify(token2, firmaSeguraAdm);
    const usuarioAModificar = verificarToken2.username;

    sequelize.query(`UPDATE usuarios SET nombreyapellido = '${nombreYApellido}', correo_electronico = '${correoElectronico}', telefono = '${telefono}', direccion_envio = '${direccion}', user_password = '${password}' WHERE usuario = '${usuarioAModificar}'`,
    ).then(function(modificacionPlato) {
        console.log(modificacionPlato)
        res.status(200).send('Su usuario a sido modificado!');
    }).catch(function(error){
        res.status(400).send('Su usuario no pudo ser modificado');
    });
})

/*VISTA DE TODOS LOS USUARIOS (EL PASSWORD NO ES MOSTRADO POR RAZONES DE SEGURIDAD)*/

app.get('/delilha/listausuarios', autorizacionAdm, (req, res) => {
    sequelize.query('SELECT usuario, nombreyapellido, correo_electronico, telefono, direccion_envio, tipo_acceso FROM usuarios', 
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(usuarios){
        res.status(200).send(usuarios)
    }).catch(function(error){
        res.status(400).send(error)
    });    
});

/*VISTA ESPECIFICA DE USUARIOS (EL PASSWORD NO ES MOSTRADO POR RAZONES DE SEGURIDAD)*/

app.get('/delilha/listausuarios/:user', autorizacionAdm, (req, res) => {
    const vistaUsuario = req.params.user;
    sequelize.query('SELECT usuario, nombreyapellido, correo_electronico, telefono, direccion_envio, tipo_acceso FROM usuarios', 
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(usuario){
        let user = usuario.find(usuarios => usuarios.usuario == vistaUsuario);
        if (user != undefined){
        res.status(200).send(user)
        }else{
         res.status(404).send('El usuario no existe')   
        };        
    }).catch(function(error){
        res.status(400).send(error)
    });
});


  /*ASIGNACION DE ROLES (1 = ROL ADMINISTRADOR, 2 = ROL USUARIO)*/

  app.put('/delilha/nuevorol/:user' , autorizacionAdm, (req, res) => {
      const roluser = req.params.user;
      const {nuevorol} = req.body;
      sequelize.query(`UPDATE usuarios SET tipo_acceso = ${nuevorol} WHERE usuario = '${roluser}'`,
      ).then(function(cambioRol) {
          res.status(200).send('El rol del usuario '+ roluser + ' fue modificado');
      }).catch(function(error){
        res.status(400).send('El rol del usuario no pudo ser modificado');
    });
  })

  /*BORRADO DE USUARIOS*/

  app.delete('/delilha/borradousuarios/:user', autorizacionAdm, (req, res) => {
    const borrarUser = req.params.user;
    sequelize.query(`DELETE FROM usuarios WHERE usuario = '${borrarUser}'`,
    ).then(function(usuarioBorrado) {
        res.status(200).send('El usuario '+ borrarUser + ' fue borrado');
    }).catch(function(error){
        res.status(400).send('Hubo un error, intente de vuelta');
    });
  });

  /*VISTA COMPLETA DE TODOS LOS PRODUCTOS*/

  app.get('/delilha/listaproductos', autorizacionAdm, (req, res) => {
    sequelize.query('SELECT * FROM menu_delilha', 
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(menu){
        res.status(200).send(menu);
    }).catch(function(error){
        res.status(400).send(error);
    });    
});

/*BUSQUEDA ESPECIFICA DE PRODUCTOS*/

app.get('/delilha/listaproductos/:producto', autorizacionAdm, (req, res) => {
    const producto = req.params.producto;
    sequelize.query('SELECT * FROM menu_delilha', 
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(menu){
        let plato1 = menu.find(platos => platos.nombre_plato == producto);
        if (plato1 != undefined){
        res.status(200).send(plato1)
        }else{
         res.status(404).send('El plato no existe')   
        };        
    }).catch(function(error){
        res.status(400).send(error)
    });    
});

/*AGREGADO DE NUEVOS PRODUCTOS*/

app.post('/delilha/listaproductos/insert', autorizacionAdm, (req, res) => { 
    const {plato, precio} = req.body
    sequelize.query('INSERT INTO menu_delilha (nombre_plato, precio) VALUES (?, ?)',
    {replacements: [plato, precio]})
    .then(function(nuevoPlato) {
        nuevoPlato.push()
        res.status(201).send('Plato creado!');
    }).catch(function(error){
        res.status(400).send('El plato no fue creado. Intente de vuelta');
    });    
});

/*ACTUALIZACION DE PRODUCTOS*/

app.put('/delilha/listaproductos/modify/:id', autorizacionAdm, (req, res) => {
    const idMenu = req.params.id;
    const {plato, nuevoprecio} = req.body;
    sequelize.query(`UPDATE menu_delilha SET nombre_plato = '${plato}', precio = ${nuevoprecio} WHERE id_plato = ?`,
    {replacements: [idMenu]}
    ).then(function(modificacionPlato) {
        console.log(modificacionPlato)
        res.status(200).send('Plato modificado!');
    }).catch(function(error){
        res.status(400).send('El plato elegido no pudo ser modificado');
    });    
});

/*BORRADO DE PRODUCTOS*/

app.delete('/delilha/menu/borrar/:plato', autorizacionAdm, (req, res) => {
    const platoABorrar = req.params.plato;
    sequelize.query('DELETE FROM menu_delilha WHERE nombre_plato = ?',
    {replacements:[platoABorrar]}
    ).then(function(platoBorrado) {
        res.status(200).send('Plato borrado!');        
    }).catch(function(error){
        res.status(400).send(error);
    })        
});

/*VISTA DE TODOS LOS PEDIDOS*/

app.get('/delilha/vistapedidosadmin', autorizacionAdm, (req, res) => {
    
    sequelize.query(`SELECT pedidos.id_pedidos, pedidos.estado, pedidos.hora, pedidos.codigo_pedido, pedidos.cantidad, pedidos.usuario, menu_delilha.nombre_plato, menu_delilha.precio, estados.estado, forma_de_pago.forma_de_pago, usuarios.nombreyapellido, usuarios.direccion_envio, pedidos.cantidad*menu_delilha.precio AS precio_total FROM pedidos JOIN menu_delilha ON pedidos.plato = menu_delilha.id_plato JOIN estados ON pedidos.estado = estados.id_estados JOIN forma_de_pago ON pedidos.modo_pago = forma_de_pago.id_forma_de_pago JOIN usuarios ON pedidos.usuario = usuarios.usuario`,
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(listaPedidos){
        res.status(200).send(listaPedidos);

    }).catch(function(error){
        res.status(400).send(error)
    });    
});

/*VISTA DE PEDIDOS ESPECIFICOS*/

app.get('/delilha/vistapedidosadmin/:pedido', autorizacionAdm, (req, res) => {
    
    const pedido = req.params.pedido;

    sequelize.query(`SELECT pedidos.id_pedidos, pedidos.estado, pedidos.hora, pedidos.codigo_pedido, pedidos.cantidad, pedidos.usuario, menu_delilha.nombre_plato, menu_delilha.precio, estados.estado, forma_de_pago.forma_de_pago, usuarios.nombreyapellido, usuarios.direccion_envio, pedidos.cantidad*menu_delilha.precio AS precio_total FROM pedidos JOIN menu_delilha ON pedidos.plato = menu_delilha.id_plato JOIN estados ON pedidos.estado = estados.id_estados JOIN forma_de_pago ON pedidos.modo_pago = forma_de_pago.id_forma_de_pago JOIN usuarios ON pedidos.usuario = usuarios.usuario`,
    {type:sequelize.QueryTypes.SELECT}
    ).then(function(pedidoBuscado){
        
        let accesoUsuario = pedidoBuscado.filter(usuarioU => usuarioU.codigo_pedido == pedido);
        res.status(200).send(accesoUsuario);

    }).catch(function(error){
        res.status(400).send(error)
    });    
});

/*ELIMINAR LINEAS CUYAS CANTIDAD ES 0 (SIRVE PARA ELIMINAR LINEAS INNECESARIAS EN LA TABLA PEDIDOS)*/

app.delete('/delilha/borrarentradassobrantes', autorizacionAdm, (req, res) => {

    sequelize.query('DELETE FROM pedidos WHERE cantidad = 0',
    ).then(function(lineasInnecesarias) {
        res.status(200).send('Las lineas vacias fueron limpiadas de la tabla de pedidos');        
    }).catch(function(error){
        res.status(400).send(error)
    });
    });

/*ELIMINAR PEDIDOS*/

app.delete('/delilha/eliminarpedido/:pedido', autorizacionAdm, (req, res) => {
    const pedidoAEliminar = req.params.pedido;

    sequelize.query(`DELETE FROM pedidos WHERE codigo_pedido = '${pedidoAEliminar}'`,
    ).then(function(lineasInnecesarias) {
        res.status(200).send('El pedido fue eliminado');        
    }).catch(function(error){
        res.status(400).send(error)
    });
    });

/*MODIFICAR PEDIDOS - MODIFICACION DE ESTADO, FORMA DE PAGO*/ 

app.put('/delilha/modificarpedido/:pedido', autorizacionAdm, (req, res) => {
    const pedidoAModificar = req.params.pedido;
    const {estadopedido, modopago} = req.body; 
    
    sequelize.query(`UPDATE pedidos SET estado = ${estadopedido}, modo_pago = ${modopago} WHERE codigo_pedido = '${pedidoAModificar}'`,
    ).then(function(modPedido) {
        
        res.status(200).send('El pedido fue modificado'); 

    }).catch(function(error){
        res.status(400).send(error)
    });
});

/*MODIFICAR PEDIDOS - MODIFICACION DE CANTIDADES Y PRODUCTOS PEDIDOS (ESTA MODIFICACION SE HACE CON EL ID_PEDIDO)*/

app.put('/delilha/modificarpedidopyc/:idlineapedido', autorizacionAdm, (req, res) => {
    const pedidoAModificar = req.params.idlineapedido;
    const {producto, cantidad} = req.body; 
    
    sequelize.query(`UPDATE pedidos SET plato = ${producto}, cantidad = ${cantidad} WHERE id_pedidos = ${pedidoAModificar}`,
    ).then(function(modPedido) {
        
        res.status(200).send('El pedido fue modificado'); 

    }).catch(function(error){
        res.status(400).send(error)
    });
});



/*SETEO DE SERVIDOR Y CODIGO DE ERROR GENERICO*/



app.use((err,req,res,next) => {
    if(!err) return next();
    console.log('Error, algo salio mal', err);
    res.status(500).send('Error');
});

app.listen(4000, () => {
    console.log('Servidor corriendo en el puerto 4000');
});