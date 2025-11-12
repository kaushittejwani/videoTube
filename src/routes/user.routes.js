import { Router } from "express";
import { login, register ,logout, refreshToken, changePassword, getCurrntUser, updateDetails, updateAvatar, updatecoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router=Router();
router.route("/register").post( upload.fields(
    [
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]
),register)
router.route("/login").post(login)

///secured route
router.route("/logout").get(verifyJwt,logout)
router.route("/refreshToken").get(refreshToken)
router.route("/changePassword").post(verifyJwt,changePassword);
router.route("/currentUser").get(verifyJwt,getCurrntUser)
router.route("/updateUserDetails").patch(verifyJwt,updateDetails)
router.route("/updateAvatar").patch(verifyJwt,upload.single('avatar'),updateAvatar);
router.route("/updateCoverImage").patch(verifyJwt,upload.single("coverImage"),updatecoverImage);
router.route("/getChannelProfile/:username").get(verifyJwt,getUserChannelProfile)
router.route("/getWatchHistory").get(verifyJwt,getWatchHistory);


export const userRoute=router;