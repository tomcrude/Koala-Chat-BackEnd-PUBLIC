const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const routes = require("./src/routes.js")

const app = express()

const port = process.env.PORT || 4000

app.use(morgan("dev"));
app.use(cors())

  app.use("/", routes);

app.listen(port, ()=>{
    console.log(`server open in port ${port}`)
})
