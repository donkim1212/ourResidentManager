var mongoose = require('mongoose');
var bcrypt = require('bcryptjs'); // 1

// schema
var userSchema = mongoose.Schema({
  username:{
    type:String,
    required:[true,'Username is required!'],
    match:[/^.{4,12}$/,'Should be 4-12 characters!'],
    trim:true,
    unique:[true, 'username already exist']
  },
  password:{
    type:String,
    required:[true,'Password is required!'],
    select:false
  },
  name:{
    type:String,
    required:[true,'Name is required!'],
    trim:true
  },
  addr:{
    type:String,
    //require:[true, 'You need to enter Detailed Address'],

  },
  email:{
    type:String,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'Should be a vaild email address!'],
    unique: true,
    trim:true,
    requried: true
  },
  isAdmin:{
    type:Boolean, default:false
  },
  email_verified :{
      type: Boolean, default: false
  },
  key_for_verify :{ type: String},
  activeChats:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'chat'
  }]
},{
  toObject:{virtuals:true}
});

/**
 * Converts given chatId string into mongoose.Types.ObjectId() and add it to
 *  the user's activeChats array (if it doesn't already have the same one).
 *
 * @param {User} user User document (i.e., userSchema) of a user
 *                  MUST BE VERIFIED BEFOREHAND, because this function won't type check.
 * @param {string} chatId string version of a chatId to be added
 */
userSchema.methods.addChat = function (user,chatId){
  var cid = mongoose.Types.ObjectId(chatId);
  if (!user.activeChats.includes(cid)){
    user.activeChats.push(cid);
    user.save(function(err){
      if (err) console.log(err);
    });
    return 1; // operation successful
  }
  return -1; // operation unsuccessful
}

/**
 * @param {User} user User document (i.e., userSchema) of a user
 *                  MUST BE VERIFIED BEFOREHAND, because this function won't type check.
 * @param {string} chatId string version of a chatId to be removed from user.activeChats
 */
userSchema.methods.removeChat = function(user,chatId){
  var cid = mongoose.Types.ObjectId(chatId);
  if (user.activeChats.includes(cid)){
    var i = user.activeChats.indexOf(cid);
    user.activeChats.splice(i,1);
    user.save(function(err){
      if (err) console.log(err);
    });
    return 1; // operation successful
  }
  return -1; // operation unsuccessful
}

userSchema.statics.findOneByUsername = function(username, callback){
  return this.findOne({username:username}, callback);
};

// virtuals
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual('originalPassword')
  .get(function(){ return this._originalPassword; })
  .set(function(value){ this._originalPassword=value; });

userSchema.virtual('currentPassword')
  .get(function(){ return this._currentPassword; })
  .set(function(value){ this._currentPassword=value; });

userSchema.virtual('newPassword')
  .get(function(){ return this._newPassword; })
  .set(function(value){ this._newPassword=value; });

// password validation
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,16}$/;
var passwordRegexErrorMessage = 'Should be minimum 4 characters of alphabet and number combination!';
userSchema.path('password').validate(function(v)
{

  var user = this;


  // create user
  if(user.isNew){
      if(!user.passwordConfirmation){
        user.invalidate('passwordConfirmation', 'Password Confirmation is required.');
      }

      if(!passwordRegex.test(user.password)){
        user.invalidate('password', passwordRegexErrorMessage);
      }
      else if(user.password !== user.passwordConfirmation) {
        user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
      }
    }
  // update user
  if(!user.isNew){
     if(!user.currentPassword){
       user.invalidate('currentPassword', 'Current Password is required!');
     }
     else if(!bcrypt.compareSync(user.currentPassword, user.originalPassword)){
       user.invalidate('currentPassword', 'Current Password is invalid!');
     }

     if(user.newPassword && !passwordRegex.test(user.newPassword)){
       user.invalidate("newPassword", passwordRegexErrorMessage);
     }
     else if(user.newPassword !== user.passwordConfirmation) {
       user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
     }
   }
 });


 // hash password // 3
 userSchema.pre('save', function (next){
   var user = this;
   if(!user.isModified('password')){ // 3-1
     return next();
   }
   else {
     user.password = bcrypt.hashSync(user.password); //3-2
     return next();
   }
 });
 // model methods // 4
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};
var User = mongoose.model('user',userSchema);
// model & export

module.exports = User;
