import express from "express"
import mongoose from "mongoose"
import Messages from "./dbMessages.js"
import Pusher from "pusher"
import cors from "cors"


//app config 
const app= express() 
const port = process.env.PORT || 9000

const pusher = new Pusher({
    appId: "1175146",
    key: "79cc5d0c852a500469fc",
    secret: "3aafdb12de79419a75a0",
    cluster: "us2",
    useTLS: true
  });

//middleware
app.use(express.json())
app.use(cors())


//db config 
const connectUrl = "mongodb+srv://admin:YCIRxkdgqvrMMXhL@cluster0.b4rhl.mongodb.net/WhatsupDb?retryWrites=true&w=majority"
mongoose.connect(connectUrl, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
const db = mongoose.connection ;

db.once("open", () => {
    console.log("Db connected")

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("A chage occured", change)

        if (change.operationType === "insert") {
            const messageDetails= change.fullDocument;
            pusher.trigger('messages', 'inserted', 
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                }
            );
        } else {
            console.log('Error triggering Push')
        }

    });

});
//??

// api routes 
app.get("/", (req, res) => res.status(200).send("Hello Dean Man"))

app.get("/messages/sync", (req, res) => {

    Messages.find((err, data) => {
        if(err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})
app.post("/messages/new", (req, res) => {
    const dbMessage = req.body 

    Messages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})
//listen
app.listen(port, () => console.log(`Listening on localhost:${port}`) )