const path = require("path")
const express = require("express")
const hbs = require("hbs")
const bodyParser = require("body-parser")
require("./db/mongoose")
const User = require("./models/user")
const auth = require("./middleware/auth")
const auth2 = require("./middleware/auth2")
const session = require("express-session")
const cookieParser = require("cookie-parser")
const flash = require("connect-flash")
const multer = require("multer")
const sharp = require("sharp")
const Post = require("./models/post")
const Lecture = require("./models/lecture")
const Assignment = require("./models/assignment")
const { log } = require("console")
const app = express()
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,"../public")
const viewsPath = path.join(__dirname, "../templates/views")
const partialsPath = path.join(__dirname, "../templates/partials")

app.set('views', viewsPath)
app.set('view engine', "hbs")
hbs.registerPartials(partialsPath)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(cookieParser())
app.use(session({
    secret: "key-deger",
    cookie: { maxAge: 60000 },
    resave: false, 
    saveUninitialized: false 
}))
app.use(flash())
app.use(express.static(publicDirectoryPath))

app.get('/', (req, res) => {
    res.render("index")
})

app.get('/signup', (req, res) => {
    res.render("signup")
})

app.get('/signup-teacher', (req, res) => {
    res.render("signup-teacher")
})

app.get('/signup-student', (req, res) => {
    res.render("signup-student")
})



const upload = multer({
    limits: {
        fileSize: 1000000 
    },
    fileFilter(req, file, cb) {

        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
           return cb(new Error("Yalnızca resim yükleyin."))
        }
        cb(undefined, true)
    }
})

app.post('/signup-student', upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({height: 75, width: 75}).png().toBuffer()  
    var name = req.body.name
    var surname = req.body.surname
    var email = req.body.email
    var password = req.body.password

    const user = new User({
        name,
        surname,
        email,
        password,
        type: 'student',
        avatar: buffer
    })

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.cookie('jwtToken', token, { httpOnly: true })
        res.redirect("/login")
    } catch (error) {
        res.render("signup-teacher")
        console.log(error.message)
    }

    
})

app.post('/signup-teacher', upload.single('avatar') ,async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({height: 75, width: 75}).png().toBuffer()  
    var name = req.body.name
    var surname = req.body.surname
    var email = req.body.email
    var password = req.body.password

    const user = new User({
        name,
        surname,
        email,
        password,
        type: 'teacher',
        avatar: buffer
    })

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.cookie('jwtToken', token, { httpOnly: true })
        res.redirect("/login")
    } catch (error) {
        res.render("signup-teacher")
        console.log(error.message)
    }

    
})

app.get('/login', (req, res) => {
    res.render("login", {
        err: req.flash('err')
    })
})

app.post('/login', async (req, res) => {
    try { 
            let user = await User.findByCredentials(req.body.email, req.body.password)
            const token = user.generateAuthToken()
            res.cookie('jwtToken', token, { httpOnly: true })
            user = await User.findById(user._id).populate('lectures').populate('assignments')
            user.lectures.forEach(element => {
                var dateTostr = element.createdAt
                element.createdAt = dateTostr.toString() 
            });
            user.assignments.forEach(element => {
                var dateTostr = element.dueDate
                element.dueDate = dateTostr.toString() 
            });
            if(user.type === "teacher") {
                res.render("teacher-home", {
                    lectures: user.lectures,
                    assignments: user.assignments
                })
            }
            else {
                res.render("student-home", {
                    lectures: user.lectures,
                    assignments: user.assignments
                })
            }
            
            
    } catch(error) {
        req.flash('err', 'Giriş Başarısız. Lütfen bilgilerinizi kontrol edin..')
        res.redirect("login")
    }
    
})

 app.post('/logout', auth, async (req, res) => {
     res.clearCookie('jwtToken')
     res.redirect("/")
})





var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' +file.originalname)
    }
  })
   
  var uploadFile = multer({ 
        storage,
        limits: {fileSize: 2000000},
        fileFilter(req, file, cb) {

            if(!file.originalname.match(/\.(jpg|rar|txt|zip|docx|pdf|pptx|jpeg|png)$/)) {
               return cb(new Error("Dosya tipi desteklenmiyor."))
            }
            cb(undefined, true)
        }
     })

     app.get("/users/:id/avatar", async (req, res) => {
        try {
            const user = await User.findById(req.params.id)
            if(!user || !user.avatar) {
                throw new Error()
            }
    
            res.set("Content-Type", "image/png")
            res.send(user.avatar)
        } catch (error) {
            res.status(404).send()
        }
    })
    

app.get('/users/:id', auth, async (req, res) => {
        try {
            const user = await User.findById(req.params.id)
            res.render('user-profile', {
                user
            })
        } catch (error) {
            
        }
        
})


app.post('/uploadfile', uploadFile.single('myFile'), (req, res, next) => {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    }
      res.send(file)
    
  })

app.post('/posts/create', auth, async(req, res) => {
    var title = req.body.title
    var content = req.body.content
    var owner = req.user._id
    var lectureid = req.query.lecid

    var lectureID = req.body.lectureId
    const post = new Post({
        title,
        content,
        owner,
        lecture: lectureid
    })

    try {
        const lecture = await Lecture.findById(req.query.lecid)
        lecture.posts.push(post)
        req.user.posts.push(post)
        await req.user.save()
        await post.save()
        await lecture.save()
        res.redirect(`/lectures/${lectureID}`)
    } catch (error) {

    }
})


app.get("/lectures/create", auth2, (req, res) => {
    res.render("lecture-create", {
        err: req.flash('err')
    })

})

app.post("/lectures/create", auth2, async (req, res) => {
    var lectureName = req.body.lectureName
    var description = req.body.description
    var lectureInstructor = req.user._id
    var lectureNo = req.body.lectureNo

    const lecture = new Lecture({
        lectureName,
        description,
        lectureInstructor,
        lectureNo
    })
    try {
        req.user.lectures.push(lecture)
        await req.user.save()
        await lecture.save()
        req.flash('success', 'Sınıf başarıyla oluşturuldu')
        res.redirect(`/lectures/${lecture._id}`)
    } catch (error) {
        req.flash('err', 'Sınıf oluşturulurken bir hata meydana geldi..')
        res.redirect(`/lectures/create`) 
    }
})

app.get("/lectures/:id", auth, async(req, res) => {
    try {
        const lecture = await Lecture.findById(req.params.id).populate('assignments').populate('posts')
        const user = await User.findById(req.user._id).populate('lectures')
        lecture.assignments.forEach(element => {
            var dateTostr = element.dueDate
            element.dueDate = dateTostr.toString() 
        });
        lecture.posts.reverse()
        if (req.user.type==='teacher') {
            res.render('teacher-lecture', {
                assignments: lecture.assignments,
                posts: lecture.posts,
                lecture,
                lectures: user.lectures,
                success: req.flash('success'),
                err: req.flash('err')
            })
        }
        else {
            res.render('student-lecture', {
                assignments: lecture.assignments,
                posts: lecture.posts,
                lecture,
                lectures: user.lectures,
                success: req.flash('success'),
                err: req.flash('err')
            })
        }
    } catch (error) {
        
    }
    

})


app.post("/lectures/join", auth, async(req, res) => {
    var lectureNo = req.body.lectureNo
    try {
        const lecture = await Lecture.findOne({lectureNo})
        lecture.students.push(req.user)
        req.user.lectures.push(lecture)
        await req.user.save()
        await lecture.save()
        req.flash('success', 'Sınıfa başarıyla katıldınız')
        res.redirect(`/lectures/${lecture._id}`) 
    } catch (error) {
        req.flash('err', 'Sınıfa katılırken bir hata meydana geldi..')
        res.redirect(`/lectures/${lecture._id}`) 
    }
    
})

app.get('/assignments/create', auth2, (req, res) => {
    res.render('assignment-create', {
        user: req.user,
        lecid: req.query.lecid
    })
})

app.post('/assignments/create', auth2, async (req, res) => {
    var name = req.body.name
    var content = req.body.content
    var dueDate = new Date(req.body.dueDate)
    var lectureid = req.query.lecid
    const assignment = new Assignment({
        name,
        content,
        dueDate,
        lecture: lectureid
    })
    try {
        req.user.assignments.push(assignment)
        
        const lecture = await Lecture.findById(lectureid).populate('students')

        for (const element of lecture.students) {
            element.assignments.push(assignment)
            await element.save()
        }
        
        lecture.assignments.push(assignment)
        await assignment.save()
        await req.user.save()
        await lecture.save()
        req.flash('success', 'Ödev başarıyla oluşturuldu')
        res.redirect(`/lectures/${lecture._id}`) 
    } catch (error) {
        req.flash('err', 'Ödev oluşturulurken bir hata meydana geldi..')
        res.redirect(`/lectures/${lecture._id}`) 
        
    }

})

app.get('/assignments/:id', auth, async(req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id).populate('lecture')
        var dizi = []
        var dateTostr = assignment.dueDate
        assignment.dueDate = dateTostr.toString() 
        
        for (const element of assignment.submissions) {
            const contents = await  User.findById(element.user)
            dizi.push(contents)
        }
        if (req.user.type==='teacher') {
            res.render('teacher-assignment', {
                assignment,
                lecture: assignment.lecture,
                submittedUsers: dizi
            })
        }
        else{
            res.render('student-assignment', {
                assignment,
                lecture: assignment.lecture
            })
        }
         
          
        
       
        
    } catch (error) {
        
    }
    
})



app.post("/assignments/:id/submit", auth, uploadFile.single("myFile"), async (req, res, next) => {
    const id = req.params.id
    try {
        const assignment = await Assignment.findById(id)
        const file = req.file
        if (!file) {
        const error = new Error('Lütfen dosya ekleyin.')
        error.httpStatusCode = 400
        return next(error)
        }
        assignment.submissions.push({user: req.user, file: file.filename})
        assignment.save()
        req.flash('success', 'Ödev başarıyla yüklendi')
        res.redirect(`/lectures/${assignment.lecture}`) 
    } catch (error) {
        req.flash('err', 'Ödev yüklenirken bir hata oluştu..')
        res.redirect(`/lectures/${assignment.lecture}`)
    }
    
})

app.get("/assignments/download/:filename", auth2, async(req, res) => {
    const file =  `${__dirname}/../uploads/${req.params.filename}`
    res.download(file)
})

app.get("*", (req, res) => {
    res.render('404')
})

app.listen(port, () => {
    console.log("Server is up on "+port)
})

