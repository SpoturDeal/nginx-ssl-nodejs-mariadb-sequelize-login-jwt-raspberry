const { User, userKeys } = require('../models');

const getAllUsers = async (req, res) => {
    const users = await User.findAll();
    if (!users) return res.status(204).json({ 'message': 'No users found' });
    res.json(users);
}

const deleteUser = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ "message": 'User ID required' });
    const user = await User.findOne({where:{ uuid: req.body.id }});
    if (!user) {
        return res.status(204).json({ 'message': `User ID ${req.body.id} not found` });
    }
    const userId = user.id
    const result = await user.destroy({where:{ uuid: req.body.id }});
    const result2 = await userKeys.destroy({where:{userId:userId}})
    res.json(result);

}

const getUser = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ "message": 'User ID required' });
    const user = await User.findOne({where:{ uuid: req.params.id }});
    if (!user) {
        return res.status(204).json({ 'message': `User ID ${req.params.id} not found` });
    }
    res.json(user);
}

module.exports = {
    getAllUsers,
    deleteUser,
    getUser
}