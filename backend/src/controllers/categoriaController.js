const Categoria = require('../models/Categoria');

exports.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.getAll();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error obteniendo categorías' });
    }
};

exports.crearCategoria = async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ mensaje: 'Nombre requerido' });

    try {
        const nueva = await Categoria.create(nombre);
        res.json(nueva);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error creando categoría' });
    }
};
