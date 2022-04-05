'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate({ userKeys }) {
            // define association here
            this.hasOne(userKeys, {foreignKey: 'userId', as: 'userkeys' })
        }

        toJSON() {
            return { ...this.get(), id: undefined, password: undefined, refreshToken: undefined, idkey:undefined }
        }

        
    }
    User.init(
        {
            uuid: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            firstname: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notNull: { msg: 'User must have a firstname.' },
                    notEmpty: { msg: 'Firstname may not be empty.'  },
                },
            },
            lastname: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notNull: { msg: 'User must have a lastname.' },
                    notEmpty: { msg: 'Lastname may not be empty.'  },
                },
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notNull: { msg: 'User must have a username.' },
                    notEmpty: { msg: 'Username may not be empty.'  },
                },
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notNull: { msg: 'User must have a mobile number.' },
                    notEmpty: { msg: 'mobilenumber may not be empty.'  },
                },
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notNull: { msg: 'User must have an E-mail address.' },
                    notEmpty: { msg: 'E-mail may not be empty.'  },
                    isEmail: {msg: "This is not valid E-mail address."}
                },
            },
            roles: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            refreshToken: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notNull: { msg: 'Password may not be empty.'  },
                    notEmpty: { msg: 'Password may not be empty.'  },
                    len: [12,64], 
                },
            },
        },
        {
            sequelize,
            tableName: 'users',
            modelName: 'User',
        }
    )
    return User
}
