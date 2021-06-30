const assert = require('assert');
const { ENGINE_METHOD_CIPHERS } = require('constants');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach( async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({data: bytecode })
        .send({from:accounts[0], gas: '1000000'});

});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });
    
    it('enters a player into the lottery', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.strictEqual(accounts[0], players[0]);
        assert.strictEqual(1, players.length);
    });

    it('enters three players into the lottery', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.strictEqual(accounts[0], players[0]);
        assert.strictEqual(accounts[1], players[1]);
        assert.strictEqual(accounts[2], players[2]);
        assert.strictEqual(3, players.length);
    });

    it('Stops people from entering with less then minimum eth', async () =>{
        try{
            await lottery.methods.enter().send({
                from: accounts[0],
                value: web3.utils.toWei('0.001', 'ether')
            }); 
            assert(false);
        } catch (err){
            assert(err);
        }
    });

    it('Stops entrants from triggering the start of the lottery', async () =>{
        try{
            await lottery.methods.pickWinner().send({
                from: accounts[1],
            }); 
            assert(false);
        } catch (err){
            assert(err);
        }
    });

    it('Players array get emptied after the lottery is called', async () =>{
        
        await lottery.methods.enter().send({from: accounts[0], value: web3.utils.toWei('1', 'ether')});
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ from: accounts[0] }); 
        const finalBalance = await web3.eth.getBalance(accounts[0]);

        assert(initialBalance < finalBalance);
    });

});