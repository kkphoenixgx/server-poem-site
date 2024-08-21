import { Router } from 'express';

import { registerUser, signInUser, getUserCollection, pushitemToDB, deleteItemFromDB, updateItemFromDB } from "../services/firebase.js"

var router = Router();

router.get('/', function(req, res, next) {
  return res.sendFile('../public/index.html');
});

//* ----------- AUTH -----------

router.post('/login', function(req, res, next) {
  const userDataRequest = req.body;

  signInUser(userDataRequest)
    .then(data=> {
      res.status(200).json({ data: data });
    })
    .catch(message=>{
      console.error("message: " + message);
      
      res.status(500).json({ message: message });
    })
    
});
router.post('/signup', function(req, res, next) {
  const userDataRequest = req.body;
  
  registerUser(userDataRequest)
    .then(data=> {
      res.status(200).json({ data: data });
    })
    .catch(err=>{
      res.status(err.status).json({ message: err });
    })
});


//* ----------- CRUD FIREBASE -----------

router.get('/poems/:id', function(req, res, next) {
  getUserCollection(req.params.id)
    .then(data=>{
      res.status(200).json({ data: data });
    })
    .catch(err=>{
      console.error(err);
      res.status(err.status).json({ message: err });
    })
});

router.post('/addPoem', function(req, res, next) {
  const userDataRequest = req.body;
  
  pushitemToDB(userDataRequest.data, userDataRequest.id)
    .then( response=>{
      res.status(200).json({ key: response });
    } )
    .catch(err => {
      console.error("Error: " + err);
    })
});

router.delete('/deletePoem/:userId/:poemKey', function(req, res, next){
  const { userId, poemKey } = req.params;

  deleteItemFromDB(poemKey, userId)
    .then( response=>{
      res.status(200).json({ message: response });
      console.log(response);
    })
    .catch( err => {
      console.error("Error: " + err)
    });

});
router.post('/updatePoem', function(req, res, next){
  const userDataRequest = req.body;

  updateItemFromDB(userDataRequest.key, userDataRequest.data, userDataRequest.id)
    .then( response=>{
      res.status(200).json({ message: response });
      console.log(response);
    })
    .catch( err => {
      console.error("Error: " + err)
    });
})


export default router;
