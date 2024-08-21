import { initializeApp } from "firebase/app";

//? INFO: Firebase addons  
import { getDatabase, ref, set, onValue, push, child, remove } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword   } from "firebase/auth";

//* ----------- Config -----------

const firebaseConfig = {
  apiKey: "AIzaSyC-VCRJ6782z4KwURIP6Hsoq2ADBstDJTo",
  authDomain: "poem-site-ab76a.firebaseapp.com",
  databaseURL: "https://poem-site-ab76a-default-rtdb.firebaseio.com",
  projectId: "poem-site-ab76a",
  storageBucket: "poem-site-ab76a.appspot.com",
  messagingSenderId: "750943802800",
  appId: "1:750943802800:web:9b38d2d39dcc422c7a7275",
  measurementId: "G-ENZQ90GM3S"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth();

const DB = getDatabase();


let currentUser = undefined;

//* ----------- Methods -----------

// ----------- DATABASE METHODS -----------

function createUserData(userUid, name, email) {


  try{
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    const formattedToday = dd + '/' + mm + '/' + yyyy;

  
    set( ref(DB, 'users/' + userUid), {
      name: name,
      email: email,
      last_login: formattedToday,
    });
    set( push(ref(DB, 'poems/' + userUid)), { 
      title: "Poem example", 
      poem: "bla bla bla", 
      color: "#15b07c", 
      date: formattedToday
    })

  }
  catch(e){
    createError(`Database could not create user data. \n ${e}`, 1002);
  }

}

export function getUserData(userUid = currentUser.uid){
  
  let getUserDataPromise = new Promise((resolve, reject)=>{

    try {
  
      const userRef = ref(DB, 'users/' + userUid );
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        resolve(data); //* change if you copy and paste 
      });
  
    } catch (error) {
      createError(`Database did not found data \n ${error}`, 1005);
      reject(`Database did not found data \n ${error}`);
    }

    
  })
  
  return getUserDataPromise;
}
export function getUserCollection(userUid = currentUser.uid){

  let getUserCollectionPromise = new Promise((resolve, reject)=>{

    try {
      let response = [];
      const userRef = ref(DB, 'poems/' + userUid);
      onValue(userRef, (snapshot) => {
        snapshot.forEach(childSnapshot => {
          let formatedObject = childSnapshot.val()
          formatedObject.key = childSnapshot.key
          response.push( formatedObject )
        });

        resolve(response);

      },{
        onlyOnce: true
      });
  
    } catch (error) {
      console.log(error);
      createError(`Database did not found data \n ${error}`, 1005);
      reject(1005);
    }

    
  })
  
  return getUserCollectionPromise;
}

export function pushitemToDB(userData, userUid = currentUser.id){

  let pushitemToDBPromise = new Promise( (resolve, reject)=>{
    try {
 
      set(push(ref(DB, 'poems/' + userUid)), userData)
      resolve( push(ref(DB, 'poems/' + userUid)).key );

    } catch (e) {
      console.log("erro");
      createError(`Falied to push item to db \n ${error}`, 1006);
      reject(1006);      
    }

  });

  return pushitemToDBPromise;
}
export function deleteItemFromDB(key, userUid = currentUser.id){
  let deleteItemFromDBPromise = new Promise( (resolve, reject)=>{
    try {
      // `poems/${userUid}/${key}`
      remove( ref(DB, `poems/${userUid}/${key}`) )
        .then( ()=>{
          resolve(`${key} removed`)
        })
        .catch( error=>{
          createError(`Firebase falied to delete item: \n ${error}`, 1008);
          console.log(error);
          reject(1008)
        })

        

    } catch (e) {
      createError(`Falied to delete item to db \n ${e}`, 1007);
      reject(1007);
    }

  });

  return deleteItemFromDBPromise;
}

// Here I just pushed and deleted
export function updateItemFromDB(key, data, userUid = currentUser.id){
  let updateItemFromDBPromise = new Promise( (resolve, reject)=>{
    try {
      // `poems/${userUid}/${key}` ref(DB, `poems/${userUid}/${key}`)
    
      pushitemToDB(data, userUid)
        .then( key=>{

          deleteItemFromDB(key, userUid)
            .then( message=>{
              resolve(`${key} pushed and ${message}`);
            })
            .catch( error =>{
              console.error(error);
            })

        })
        .catch( error=>{
          console.error(error);
        })

    } catch (e) {
      createError(`Falied to update item to db \n ${e}`, 1007);
      reject(1007);
    }

  });

  return updateItemFromDBPromise;
}


// ----------- AUTH METHODS -----------

export function registerUser(userDataRequest){
  let createUserPromisse = new Promise((resolve, reject)=>{

    try {
      validateFields(userDataRequest, true);
      createUserWithEmailAndPassword(auth, userDataRequest.email, userDataRequest.password)
        .then((userCredential) => {
          currentUser = userCredential.user;

          createUserData(currentUser.uid, userDataRequest.name, userDataRequest.email);
          resolve(currentUser);
        })
        .catch((error) => {

          createError(`Database could not register user authenticator. \n ${error}`, 1001);
          reject(1001);

        });

      
    } catch (error) {
      
      createError(`Database could not register/create user authenticator. \n ${error}`, 1003);
      reject(1003);
    }
    
  }) 

  return createUserPromisse;
}

export function signInUser(userDataRequest){
  let createUserPromisse = new Promise((resolve, reject)=>{

    try {
      
        validateFields(userDataRequest, false, reject);

        signInWithEmailAndPassword(auth, userDataRequest.email, userDataRequest.password)
        .then((userCredential) => {
          currentUser = userCredential.user;
          resolve(currentUser);
        })
        .catch((error) => {
          createError(`Database could not authenticate user \n ${error}`, 1004)
          reject(`Database could not authenticate user \n ${JSON.stringify(error)}`);
        });

    } catch (error) {
      
      createError(`Database could not authenticate user \n ${error}`, 1004)
      reject(`Database could not authenticate user \n ${JSON.stringify(error)}`);
    }
    
  }) 

  return createUserPromisse;
}

//* SIDE METHODS


function validateFields(userDataRequest, validatePasswordAndName = false, reject = null){

  if(!userDataRequest) createError("Empty data", 1100, reject);
  if(!userDataRequest.email) createError("Empty email", 1102, reject);
  
  if(validatePasswordAndName){
    let isPasswordRight = userDataRequest.password.toString().length > 6
    
    if(!userDataRequest.password) createError("Empty password", 1103, reject)
    if(!isPasswordRight) createError("Invalid Password", 1105, reject);

    if(!userDataRequest.name) createError("Empty name", 1101, reject);
  }

  const validateEmail = (email)=>{
    const expression = /\S+@\S+\.\S+/;
    return expression.test(email)
  }

  if(!validateEmail(userDataRequest.email)) createError("Invalid Email", 1104, reject)
}

function createError(message, code, reject = null){
  const erro = new Error(message);
  erro.status = code;
  console.error(`Code error: ${code}`);
  console.error(erro);

  if(reject){
    reject(`Error: ${message}`);
    return false;
  }
}


