const jwt = require("jsonwebtoken")
const User = require("../models/user")

const auth2 = async (req, res, next) => {
    var token = req.cookies.jwtToken
    if(token) {

        try {
            const decoded = jwt.verify(token, "keyfikeydegeri")
            const user = await User.findOne({_id: decoded._id})
            if(!user || user.type!='teacher') {
                throw new Error()
            }
            req.user = user
            req.token = token

            next()
        } catch (error) {
            
        }
        
    }
    else {
        res.redirect("/login")
    }
}
module.exports = auth2