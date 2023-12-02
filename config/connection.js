const mongoose = require('mongoose')
const connectionUrl = process.env.connectURI || "mongodb+srv://sparsharora:sparsharora15@cluster0.znskbqc.mongodb.net/chat-app?retryWrites=true&w=majori"
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000,
      },
    
  };
exports.connect = async()=>{
    try{
    await mongoose.connect(connectionUrl,mongoOptions)
    console.log("connnected to db");
}
catch(e){
    console.log(e);
}
}