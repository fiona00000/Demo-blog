require('dotenv').config()
const bcrypt = require('bcryptjs')
const mongoose = require("mongoose")

const Schema = mongoose.Schema
const userSchema = new Schema({
    "userName": { type: String, required: true, unique: true },
    "password": String,
    "email": String,
    "loginHistory": [{ "dateTime": Date, "userAgent": String }]
})

const UserModel = mongoose.model('UserModel', userSchema)

let User

const initialize = function () {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(process.env.MONGO_URI_STRING);

        db.on('error', (err) => {
            reject(err);
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

const registerUser = (userData) => {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2)
            reject("Passwords do not match")
        bcrypt.hash(userData.password, 10).then(hash => {
            userData.password = hash
        })
            .then(() => {
                let newUser = new User(userData)
                newUser.save()
                    .then(() => {
                        resolve()
                    })
                    .catch((err) => {
                        if (err.code === 11000)
                            reject("User Name already taken")
                        reject(`There was an error creating the user: ${err}`)
                    })
            })
            .catch(err => {
                console.log(err)
                reject("There was an error encrypting the password")
            })
    })
}

const checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({ "userName": userData.userName })
            .exec()
            .then((users) => {
                if (!users.length)
                    reject(`Unable to find user: ${userData.userName}`)

                bcrypt.compare(userData.password, users[0].password)
                    .then((result) => {
                        if (result === false)
                            reject(`Incorrect Password for user: ${userData.userName}`)

                        // Keep last 10 records only
                        const loginHistory = users[0].loginHistory || [];
                        if (loginHistory.length >= 10) {
                            users[0].loginHistory = loginHistory.slice(-10);
                        }

                        users[0].loginHistory.push({ dateTime: (new Date()).toString(), userAgent: userData.userAgent })
                        User.updateOne(
                            { "userName": users[0].userName },
                            { "$set": { "loginHistory": users[0].loginHistory } }
                        ).exec()
                            .then(() => {
                                resolve(users[0])
                            })
                            .catch(err => {
                                reject(`There was an error verifying the user: ${err}`)
                            })
                    })
                    .catch(err => {
                        console.log(err)
                        reject("There was an error encrypting the password")
                    })
            })
            .catch(err => {
                console.log(err)
                reject(`Unable to find user: ${userData.userName} ${err}`)
            })
    })
}

module.exports = { initialize, registerUser, checkUser }