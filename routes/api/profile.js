const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');

const Profile = require('../../models/profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const { route } = require('./users');

/*
@route GET api/profile/me
@desc Get current users profile
@access private
*/
router.get('/me', auth, async (req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user',
        ['name','avatar']);

        if(!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/*
@route POST api/profile
@desc Create/Update user's profile
@access private
*/
router.post('/', [auth,[
    check('status', 'status is required')
        .not()
        .isEmpty(),
    check('skill', 'skill is required')
        .not()
        .isEmpty()
]
],
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {
        company,
        location,
        bio,
        status,
        githubusername,
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
      } = req.body;

    const profileField = {}
    profileField.user = req.user.id;
    if(company) profileField.company = company;
    if(website) profileField.website = website;
    if(location) profileField.location = location;
    if(bio) profileField.bio = bio;
    if(status) profileField.status = status;
    if(githubusername) profileField.githubusername = githubusername;
    if(skills){
        profileField.skills = skills.split(',').map(skill => skill.trim());
    }

    profileField.social = {}
    if(youtube) profileField.social.youtube = youtube;
    if(twitter) profileField.social.twitter = twitter;
    if(facebook) profileField.social.facebook = facebook;
    if(linkedin) profileField.social.linkedin = linkedin;
    if(instagram) profileField.social.instagram = instagram;
    
    try{
        let profile = await Profile.findOne({ user: req.user.id });

        if(profile){
            profile = await Profile.findOneAndUpdate(
                { user : req.user.id }, 
                { $set : profileField },
                { new : true}
            );
            return res.json(profile);
        }

        profile = new Profile(profileField);
        await profile.save();
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


/*
@route GET api/profile
@desc Get all/profile
@access public
*/
router.get('/', async (req,res) => {
    try{
        const profiles = await Profile.find().populate('user',
        ['name','avatar']);
        res.json(profiles);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
})

/*
@route GET api/profile/user/:user_id
@desc Get profile by userId
@access public
*/

router.get('/user/:user_id', async (req,res) => {
    try{
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user',
        ['name','avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.json(profile);
    }catch(err){
        console.error(err.message);
        if(err.kind == 'ObjectId'){
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server error');
    }
});

/*
@route DELETE api/profile/
@desc Delete profile, user & posts
@access public
*/

router.delete('/', auth, async (req,res) => {
    try{
        //Remove users posts
        //Remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove( { id: req.user.id });

        res.json({ msg: 'User delete' });
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/*
@route Put api/profile/experience
@desc Delete profile, user & posts
@access public
*/

router.put('/experience', [auth, [
        check('title', 'title is required')
        .not()
        .isEmpty(),
        check('company', 'company is required')
        .not()
        .isEmpty(),
        check('from', 'from date is required')
        .not()
        .isEmpty()
    ]
], 
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json( {errors: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne( { user: req.user.id });

        profile.experience.unshift(newExp);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/*
@route Delete api/profile/experience/:exp_id
@desc Delete experience from profile
@access private
*/

router.delete('/experience/:exp_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne( { user: req.user.id });

        const removeIdx = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIdx, 1);

        await profile.save();

        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


/*
@route Put api/profile/education
@desc add profile education
@access public
*/

router.put('/education', [auth, [
        check('school', 'School is required')
        .not()
        .isEmpty(),
        check('degree', 'Degree is required')
        .not()
        .isEmpty(),
        check('from', 'from date is required')
        .not()
        .isEmpty(),
        check('fieldofstudy', 'Field of study is required')
        .not()
        .isEmpty(),
    ]
], 
async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json( {errors: errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne( { user: req.user.id });

        profile.education.unshift(newEdu);

        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/*
@route Delete api/profile/education/:edu_id
@desc Delete education from profile
@access private
*/

router.delete('/education/:edu_id', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne( { user: req.user.id });

        const removeIdx = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIdx, 1);

        await profile.save();

        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

/*
@route Get api/profile/github/:username
@desc Get user's repo from github
@access public
*/

router.get('/github/:username', (req,res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };
        request(options, (error, response, body) => {
            if(error) console.error(error.message);

            if(response.statusCode !== 200) {
                return res.status(404).json( {msg: 'No Github profile found' });
            }

            res.json(JSON.parse(body));
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
})

module.exports = router;
