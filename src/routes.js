const express = require("express")
const path = require("path")
const Router = express.Router()
const pool = require("./dataBase/conection.js")
const nodemailer = require('nodemailer');
const config = require("./config");
const bodyParser = require('body-parser');
const multer = require('multer')
const fs = require("fs")

const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;


let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "koalakveri@gmail.com",
    pass: config.passwordEmail,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    refreshToken: config.refreshToken,
  },
 });


Router.use(express.static(path.join(__dirname, "./images")))


Router.use(express.static(path.resolve(__dirname, '../client/build')));
Router.use(bodyParser.json());
Router.use(bodyParser.urlencoded({ extended: true }));

const diskstorage = multer.diskStorage({
  destination: path.join(__dirname, "./images"),
  filename: (req,file,cb)=>{
      cb(null, "image-" + file.originalname)
  }
})

const fileupload =  multer({
  storage: diskstorage
}).single("image")


Router.post("/c-a", async (req,res)=>{
  const { name, pass, passveri, email} = req.body;
  if (name == null || name == undefined || name.length == 0 || name.length > 13 || pass.length > 13 || pass == null || pass == undefined || pass.length == 0 ||  email  == null || email == undefined || email.length == 0 || passveri != pass){ await console.log("The data entered is incorrect")} 
  else {
    await pool.getConnection(async(e, con)=>{
      if (e) return console.log(e)
      const verification = Math.random()*1000000000
      const des = "This user has no description."
      const bgcolor = "rgb(190,200,200)"
      const followers = ","
      const following = ","
      const info = {name, pass, email, verification,des,bgcolor,followers,following}

      const data = {
        from: 'koalakveri@gmail.com',
        to: email,
        subject: "Koala Verification",
        html: `<p>Hi ${name} ,access this link to finish the verification process:</p><a>https://koala-server.onrender.com/verify/${verification}</a>`
      }

      const info2 = [info.name, info.email]
      await con.query(`SELECT name FROM users WHERE name = ? OR email = ?`, info2, async (e,row)=>{
        if (e) return console.log(e)
        else if (row.length == 0){
          await con.query(`INSERT INTO users SET ?`, info,
      (e, rows)=>{
        if (e) return console.log(e)
        else console.log("User Accept");

        transporter.sendMail(data, function (error, info) { 
          if(error){ 
               console.log("Error al enviar email"); 
          } else{ 
               console.log("Correo enviado correctamente"); 
          } 
        });

      console.log("User validation TRUE")
        res.json({state: "successful"})
      })}

        else if (row.length > 0) {console.log("User validation FALSE"), res.json({state: "denied"})}

      })
      con.release();

    })
  }
})

Router.post("/c-b", (req,res)=>{
  const {email, pass} = req.body
  if ( pass == null || pass == undefined || pass.length == 0 || pass.length > 13 ||  email  == null || email == undefined || email.length == 0){ console.log("The data entered is incorrect")} 
  const info = [email, pass]
  pool.getConnection((e,con)=>{
    if (e) return console.log(e)
    con.query(`SELECT email, pass,verification,id,name FROM users WHERE email = ? AND pass = ?`, info ,(e,row)=>{
      if (e) return console.log(e)
      else if (row.length === 0){
        res.json({state: "Wrong email or password."})
        console.log("ACCESS_DENIED")
      }
      else{
        if(row[0].verification !== "true"){res.json({state: "You have to confirm your email."})}
        else{
        res.json({state: "successful", token: row[0].id, name:row[0].name})
        console.log("ACCESS_SUCCESS")}
      }

    })
    con.release();
  })
})



Router.get("/verify/:id",(req,res)=>{
  res.redirect("https://koala-chat.vercel.app/signin")
  var id = req.params.id
  pool.getConnection((e, con)=>{
    if (e) return console.log(e)
    con.query("SELECT verification FROM users WHERE verification = ?", id, (e,row)=>{
      if (e) return console.log(e)
      
      else if (row.length == 0){console.log("Incorrect ID")}

      else if (row.length > 0){ pool.getConnection((e,con)=>{
        if (e) return console.log(e)
        console.log("Email Confirmed")
        con.query(`UPDATE users SET verification = 'true'  WHERE verification = ?`,id)
      }) }
    })
    con.release();
  })
  
})

Router.post("/c-c", (req,res)=>{
  const email = req.body.email
  pool.getConnection((e,con)=>{
    if (e) return console.log(e)
    con.query(`SELECT email,name,pass FROM users WHERE email = ?`, email, (e,row)=>{
      if (e) return console.log(e)
      
      else if (row.length == 0){console.log("The Email dosen't exist"); res.json({state: "denied"})}
      else{
        
const data = {
	from: 'koalakveri@gmail.com',
	to: row[0].email,
	subject: "Koala Password",
	html: `<p>Hi ${row[0].name}, your password is: ${row[0].pass}.</a>`
};

transporter.sendMail(data, function (error, info) { 
  if(error){ 
       console.log("Error al enviar email"); 
  } else{ 
       console.log("Correo enviado correctamente"); 
  } 
});


        res.json({state: "successful"})
      }
    })
    con.release();
  })
})

Router.get("/user/:token", (req,res)=>{
  const info = req.params.token.split(",")
  const token = info[0]
  const user = info[1]
  pool.getConnection((e, con)=>{
    if (e) return console.log(e)
    con.query(`Select name,des,imgData,imgName,imgType,followers,following,bgcolor from users WHERE id = ? AND verification = "true"`, token, 
    (e, rows)=>{
      
      if (e) return console.log(e)
      else if (rows.length === 0){console.log("No users"), res.json([{status: "error"}])}
      else{
        const file = {imgData, imgName, imgType} = rows[0]
      console.log("User found")  
      if (rows[0].followers === null || rows[0].followers === undefined ){console.log("No followers"); 
      
      if (rows[0].followers == undefined || rows[0].followers == null){
        res.json([rows[0], color = "rgb(150,150,150)", text = "unfollow"])
      }
      else { res.json([rows[0], color = "", text = "follow"])}
    
    }
      else{
      let array = rows[0].followers.split(",").find(e => e == user)
   
      if (array == user){
        res.json([rows[0], color = "rgb(150,150,150)", text = "unfollow"])
      }
      else { res.json([rows[0], color = "", text = "follow"])}}

    }
    }) 
    con.release();
  })
}
)

Router.get("/users/random/:token", (req,res)=>{
  const token = req.params.token
  pool.getConnection((e, con)=>{
    if (e) return console.log(e)
    con.query(`Select name,id,imgData FROM users WHERE verification = "true" AND NOT id = ? ORDER BY RAND() LIMIT 4`,token,  
    (e, rows)=>{
      if (e) return console.log(e)
      else if (rows.length === 0){console.log("No users")}
      else{res.json(rows);console.log("Users found")}
    }) 
    con.release();
  })
}
)

Router.post("/users/search", (req,res)=>{
  const name = req.body.name + "%"
  pool.getConnection((e, con)=>{
    if (e) return console.log(e)
    con.query(`Select name,id,imgData FROM users WHERE name LIKE ? AND verification = "true"`,name,  
    (e, rows)=>{
      if (e) return console.log(e)
      else if (rows.length === 0){console.log("No users");res.json([{state: "none"}])}
      else{console.log("Users found");res.json(rows)}
    }) 
    con.release();
  })
}
)

Router.put("/user/update/:id/:name/:des/:bgcolor/:user",fileupload, (req,res)=>{
  const {id,name, des, bgcolor,user} = req.params
  if (name === null || name === undefined || name.length === 0 ||  des === null || des === undefined || des.length === 0 || bgcolor === null || bgcolor === undefined || bgcolor.length === 0){return console.log("Stop Hacking")}
  else {

    if (!req.file) {
      console.log("No file upload");
  } else {
      
    const imgType = req.file.mimetype
    const imgName = req.file.originalname
    const imgData = fs.readFileSync(path.join(__dirname, "./images/" + req.file.filename))
    if (imgType !== "image/png" && imgType !== "image/jpeg" || req.file.size > 500000){console.log("bad image")}
    else {pool.getConnection((e,con)=>{
      con.query("UPDATE users SET ? WHERE id = ?", [{imgType, imgName, imgData}, id], (e,rows)=>{
        if (e) return console.log(e)
        console.log("Image upload")
        fs.unlinkSync(path.join(__dirname, "./images/" + "image-" + imgName))
    })
    })}
  }
    pool.getConnection((e, con)=>{
      const info = {name,des,bgcolor}
      if (e) return console.log(e)
      con.query("SELECT name from users WHERE id = ?",id,(e,row)=>{
        if (e) return console.log(e)
        if (row.length === 0){return console.log("error")}
        const oldName = row[0].name

        con.query("SELECT name FROM users WHERE name = ?",name,(e, row)=>{
          if (row.length > 0){if(user === row[0].name){con.query("UPDATE users SET ?  WHERE id = ?",[info,id],(e,row)=>{
            if (e) return console.log(e)
            res.json({state: "successful"})
          })} else {res.json({state: "The username is already taken."})}}
          
          else {con.query("UPDATE users SET ?  WHERE id = ?",[info,id],(e,row)=>{
            if (e) return console.log(e)
           
            con.query(`SELECT messages from rooms WHERE messages LIKE ?`,["%%%" + oldName + "%%%"],(e,row)=>{
              if (e) return console.log(e)
              if (row.length > 0){
                let infoChange

                const change = row[0].messages.split("%%%%")
                change.map((stat)=>{
                  const messa = stat.split("%%%")
                  let inf1
                  messa.map((st)=>{
                    if (inf1 === undefined){inf1 = st + "%%%"}
                    else if (st == oldName){inf1 = inf1 + name + "%%%"}
                    else {inf1 = inf1 + st + "%%%"}
                  })
                  if (infoChange === undefined){infoChange = inf1 + "%"}
                  else {infoChange = infoChange + inf1 + "%"}
                })
                

                con.query("UPDATE rooms SET messages = ? WHERE messages LIKE ?",[infoChange,"%" + oldName + "%"],(e,row)=>{
                  if (e) return console.log(e)
                })
                
              }
            })
            res.json({state: "successful"})
          })}
        })  
      })
      con.release();
    })
  }
})

Router.get("/images/get",(req,res)=>{
  pool.getConnection((e, con)=>{
      if (e) return console.log(e)
      con.query("SELECT * FROM users", (e,rows)=>{
          if (e) return console.log(e)
          if (rows.length === 0){return console.log("no images")}
          rows.map(img =>{
              if (img.imgData === null){}
              else
              {fs.writeFileSync(path.join(__dirname, "./images/" + img.id + "-img.png"), img.imgData)}
          }  )
          const im = fs.readdirSync(path.join(__dirname, "./images/"))
          res.json(im)
      })
      con.release(); 
  })
 
})

Router.post("/users/follower", (req,res)=>{
  const {followers,following} =  req.body
  pool.getConnection((e,con)=>{
    if (e) return console.log(e)
    
    con.query("SELECT followers,following FROM users WHERE id = ?",followers ,(e,row)=>{
      if (e) return console.log(e)
      if (row.length === 0){return console.log("No users left"); res.json({state: "error"})}
      else {
        const follsHiss = row[0].following


        con.query("SELECT followers FROM users WHERE id = ? ",following,async(e,row)=>{
          if (e) return console.log(e)
    
          let follsHis; let follisHis
    
          async function comprobation (){
            if (follsHiss === ","){follsHis = ""}
            else {follsHis = follsHiss}
            if (row[0].followers === ","){follisHis = ""}
            else {follisHis = row[0].followers}
            return [follisHis,follsHis]
          }
          const [followersHis, followingsHis] = await comprobation()
          /*console.log("point - 1 " + followersHis + "  " + followingsHis)*/
    
          const follower = followersHis + followers + "," 
          const follwings = followingsHis + following + "," 
          /* console.log("point - 2 " + follower + "  " + follwings) */
    
          console.log("followers" + followersHis, "followings" + followingsHis)
          if (row.length === 0){return console.log("error")}
          
          con.query("SELECT id,followers FROM users WHERE id = ? AND followers LIKE ? OR id = ? AND followers LIKE ?",[following, "%," + followers + ",%",following, followers + ",%"],(e,row)=>{
           
            if (e) return console.log(e)
            if (row.length > 0){
             /* console.log("point - 3" + row[0].followers) */
              
              let array = followersHis.split(",")
              let delet = array.filter((item) => item !== followers)
              let string = delet.toString()
              
    
              con.query("UPDATE users SET followers = ? WHERE id = ?", [string,following],(e,row)=>{
                if (e) return console.log(e)
              })
              
            }
            else {
              addFoll(followers,following,follwings,follower)
            }
          })
          con.query("SELECT following FROM users WHERE id = ? AND following LIKE ? OR id = ? AND following LIKE ?",[followers, "%," + following + ",%",followers, following + ",%"  ],(e,row)=>{
            
            if (row.length > 0){
              console.log("point - 3.5" + row[0])
              let array = followingsHis.split(",")
              let delet = array.filter((item) => item !== following)
              let string = delet.toString()
              con.query("UPDATE users SET following = ? WHERE id = ?", [string, followers],(e,row)=>{
                if (e) return console.log(e)
              })
            }
            else {
              addFoll(followers,following,follwings,follower)
            }
          })
         
        })

      }
      res.json({state: "..."})
    })

    con.release();
  })

})

function addFoll (follower,following,follwings,foll){
  console.log(follwings)
  pool.getConnection((e,con)=>{
    if (e) return console.log(e)
    con.query("UPDATE users SET followers = ? WHERE id = ? ", [foll,following],(e,row)=>{
      if (e) return console.log(e)
    })
    con.query("UPDATE users SET following = ? WHERE id = ? ", [follwings,follower],(e,row)=>{
      if (e) return console.log(e)
    })
    con.release();})
}

Router.get("/users/followers/ing/:token", (req,res)=>{
  const token = req.params.token
  console.log(token)
  pool.getConnection((e, con)=>{
    if (e) return console.log(e)
    con.query(`Select followers, following FROM users WHERE id = ?`,token,  
    (e, rows)=>{
      if (e) return console.log(e)
      else if (rows.length === 0){console.log("No users");res.json([{state: "error"}])}
      else{
    
        
        let array = rows[0].followers.split(",")
        let array2 = rows[0].following.split(",")
        
        
        con.query(`SELECT name,id,imgData FROM users WHERE id IN (?)`,[array],(e,row)=>{
          if (e) return console.log(e)
          const follower = row
          con.query(`SELECT name,id,imgData FROM users WHERE id IN (?)`,[array2],(e,row)=>{
            if (e) return console.log(e)
            res.json([follower, row])
          })
        })
      }
    }) 
    con.release();
  })
}
)

Router.post("/chat/room/:token", (req,res)=>{
  const room = req.params.token
  const {messages,datee,id} = req.body
  if (messages === null || messages === undefined || messages === "" || messages.length > 100){return console.log("error")}
  pool.getConnection((e, con)=>{
    if (e) return console.log(e)

    con.query("SELECT name FROM users WHERE id = ?",id,(e,row)=>{
      if (e) return console.log(e)
      else if (row.length === 0){console.log("no users"), res.json({status: "error"})}
      
      else {
        const userName = row[0].name
        con.query("SELECT id,messages,people FROM rooms WHERE id = ?",room, (e,row)=>{
          
          if (row.length === 0){return console.log("Stop hacking :(")}
          
          const data = row[0].people.split(",")

          if (e) return console.log(e)

          else if (row.length === 0 || row[0].people !== "public," && data[0] !== id && data[1] !== id){

            console.log("no users"), res.json({status: "error"})
            
          }

      else {
        let info
        if (row[0].messages === null){info = messages + "%%%" + datee + "%%%" + userName + "%%%" + id + "%%%" + row[0].id + "%%%%"}
        else info = row[0].messages + messages + "%%%" + datee + "%%%" + userName + "%%%" + id + "%%%" + row[0].id + "%%%%"
        
        const update = "true," + id
        
        con.query(`UPDATE rooms SET messages = ?, datee = ?, updatee = ? WHERE id = ?`, [info,datee,update,room], 
        (e, rows)=>{
          if (e) return console.log(e)
          else if (rows.length === 0){console.log("no room"), res.json({status: "error"})}
          else{res.json(rows)}
        })
      }
        })
      }
    }) 
    con.release();
  })
}
)

Router.get("/chat/room/:token", (req,res)=>{
  const data = req.params.token.split(",")
  const room = data[0]
  const user = data[1]

  pool.getConnection((e, con)=>{
    if (e) return console.log(e)
    con.query(`Select * from rooms WHERE id = ?`, room, 
    (e, rows)=>{
      if (e) return console.log(e)
      else if (rows.length === 0){console.log("no room"), res.json([{state: "error"}])}

      else{
        const userFilter = rows[0].people.split(",").filter(stat => stat !== user)
         con.query(`SELECT people,id,messages,updatee FROM rooms WHERE people LIKE ? OR people LIKE ? ORDER BY datee DESC `, ["%," + user ,user + ",%"], (e,row)=>{
      if (e) console.log(e)

      if (row.length === 0){return res.json([rows[0]])}
      let info
       list = row
      list.map(stat => {info = info + "," + stat.people})

        const noUser = info.split(",").filter(stat => stat !== user)

       con.query(`UPDATE rooms SET updatee = "none" WHERE id = ? AND updatee LIKE ?`,[room,"%," + userFilter]) 

       con.query("SELECT name,id,imgType FROM users WHERE id IN (?)",[noUser],(e,row)=>{
        if (e) console.log(e)

        const permision = rows[0].people.split(",")
  
        if (permision[0] !== "public"){
  
          if (permision[0] !== user && permision[1] !== user ){
            console.log("acceso no permitido")
            res.json([{state: "error"}])
  
          }
          else{
            res.json([rows[0],list,row]); console.log("accseso permitido")
  
  
        }}
  
       else { res.json([rows[0],list,row]); console.log("accseso permitido")}
       })       
    })    
    }
    }) 
    con.release();
  })
}
)

Router.get("/chat/room/search/:info", (req,res)=>{
  const data = req.params.info.split(",")
  const name = data[0]
  const user = data[1]
  
  pool.getConnection((e,con)=>{
    if (e) return console.log(e)
    con.query("SELECT id,name,imgType FROM users WHERE name LIKE ? AND NOT id = ?",[name + "%", user],(e,row)=>{
      if (e) return console.log(e)
      else if (row.length === 0){return console.log("no user")}
      else {
        let array = 4
        let array2 = 4
        row.map((stat)=>{if (array === 4){array = stat.id + "," + user + "+"; array2 = user + "," + stat.id + "+"}else if (stat.id == user){}else{array = stat.id + "," + user + "+" + array; array2 = user  + "," + stat.id + "+" + array2}})
        
        let array3 = array.split("+")
        let array4 = array2.split("+")

         const list = row
      
        con.query("SELECT id,people,messages,updatee,datee FROM rooms WHERE people IN (?) OR people IN (?) ORDER BY datee DESC",[array3,array4],(e,rows)=>{
          if (e) return console.log(e)
          res.json([rows,list])
        })
      }
    })
    con.release();
  })
})

Router.post("/chat/room/private/:id", (req,res)=>{
  const id = req.params.id
  const {user} = req.body
  if (user === id){ return console.log("no room")}

  pool.getConnection((e,con)=>{
    if (e) return console.log(e)
    const info = id + "," + user
    const info2 = user + "," + info
    con.query("SELECT * FROM rooms WHERE people = ? OR people = ?", [info, info2],(e,row)=>{
      if (e) return console.log(e)
      else if (row.length === 0){
        console.log("tabla no existe vamo a crearla")
          if (e) return console.log(e)
          con.query("INSERT INTO rooms SET people = ?", info,(e,row)=>{
            if (e) return console.log(e)
            con.query("SELECT * FROM rooms WHERE id = ?", row.insertId,(e,row)=>{
              if (e) return console.log(e)
              if (row.length === 0){return console.log("error")}
              res.json(row)
            })
            
           })}
           else {
            res.json(row)
          }
    })
    con.release();
  })
})

Router.get("/start", (req,res)=>{
  pool.getConnection((e,con)=>{
    if (e) return console.log(e)
    con.query("SELECT name FROM users WHERE id = 1", (e,row)=>{
      if (e) return console.log(e)
      res.json(row)
    })
  })
})

  module.exports = Router;

