import mongoose,{Schema,model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const playlistSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        requried:true
    },
    video:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})
playlistSchema.plugin(mongooseAggregatePaginate)

export const playlist=mongoose.model('Playlist',playlistSchema)