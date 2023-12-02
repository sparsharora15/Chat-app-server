const mongoose = require('mongoose')
const connectionUrl = process.env.connectURI
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