// @flow
'use strict'

const BigNumber = web3.BigNumber;
const expect = require('chai').expect;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

import ether from './helpers/ether';
import { advanceBlock } from './helpers/advanceToBlock';
import increaseTime, { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';
import EVMThrow from './helpers/EVMThrow';

const MyEtherHODL = artifacts.require('MyEtherHODL.sol');

const data1y = web3.sha3('hodlFor1y()').substring(0, 10);
const data2y = web3.sha3('hodlFor2y()').substring(0, 10);
const data3y = web3.sha3('hodlFor3y()').substring(0, 10);
const dataParty = web3.sha3('party()').substring(0, 10);

contract('MyEtherHODL', function ([_, wallet1, wallet2, wallet3, wallet4, wallet5]) {

    it('should receive ether', async function () {
        const hodl = await MyEtherHODL.new();

        await web3.eth.sendTransaction({ from: wallet1, to: hodl.address, value: 100 });

        (await hodl.balanceOf.call(_)).should.be.bignumber.equal(0);
        (await hodl.balanceOf.call(wallet1)).should.be.bignumber.equal(100);
        (await hodl.balanceOf.call(wallet2)).should.be.bignumber.equal(0);
        (await hodl.balanceOf.call(wallet3)).should.be.bignumber.equal(0);

        await web3.eth.sendTransaction({ from: wallet2, to: hodl.address, value: 200 });

        (await hodl.balanceOf.call(_)).should.be.bignumber.equal(0);
        (await hodl.balanceOf.call(wallet1)).should.be.bignumber.equal(100);
        (await hodl.balanceOf.call(wallet2)).should.be.bignumber.equal(200);
        (await hodl.balanceOf.call(wallet3)).should.be.bignumber.equal(0);

        await web3.eth.sendTransaction({ from: wallet3, to: hodl.address, value: 300 });

        (await hodl.balanceOf.call(_)).should.be.bignumber.equal(0);
        (await hodl.balanceOf.call(wallet1)).should.be.bignumber.equal(100);
        (await hodl.balanceOf.call(wallet2)).should.be.bignumber.equal(200);
        (await hodl.balanceOf.call(wallet3)).should.be.bignumber.equal(300);
    })

    it('should remember time', async function () {
        const hodl = await MyEtherHODL.new();

        await web3.eth.sendTransaction({ from: wallet1, to: hodl.address, value: 100 });
        (await hodl.lockedUntil.call(wallet1)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );

        await web3.eth.sendTransaction({ from: wallet2, to: hodl.address, value: 200, data: data1y });
        (await hodl.lockedUntil.call(wallet1)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );
        (await hodl.lockedUntil.call(wallet2)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );

        await web3.eth.sendTransaction({ from: wallet3, to: hodl.address, value: 300, data: data2y });
        (await hodl.lockedUntil.call(wallet1)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );
        (await hodl.lockedUntil.call(wallet2)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );
        (await hodl.lockedUntil.call(wallet3)).toNumber().should.be.within(
            latestTime() + duration.years(2) - duration.minutes(1),
            latestTime() + duration.years(2)
        );

        await web3.eth.sendTransaction({ from: wallet4, to: hodl.address, value: 400, data: data3y });
        (await hodl.lockedUntil.call(wallet1)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );
        (await hodl.lockedUntil.call(wallet2)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );
        (await hodl.lockedUntil.call(wallet3)).toNumber().should.be.within(
            latestTime() + duration.years(2) - duration.minutes(1),
            latestTime() + duration.years(2)
        );
        (await hodl.lockedUntil.call(wallet4)).toNumber().should.be.within(
            latestTime() + duration.years(3) - duration.minutes(1),
            latestTime() + duration.years(3)
        );
    })

    it('should not get fees when party is after period', async function () {
        const hodl = await MyEtherHODL.new();

        await web3.eth.sendTransaction({from: wallet1, to: hodl.address, value: 100});
        (await hodl.lockedUntil.call(wallet1)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );

        increaseTime(duration.years(1));
        await advanceBlock();

        const balanceBefore = new BigNumber(web3.eth.getBalance(wallet1));
        const txid = await web3.eth.sendTransaction({from: wallet1, to: hodl.address, value: 0, data: dataParty});
        const transaction = await web3.eth.getTransaction(txid);
        const receipt = await web3.eth.getTransactionReceipt(txid);
        const balanceAfter = new BigNumber(web3.eth.getBalance(wallet1));

        balanceAfter.should.be.bignumber.equal(balanceBefore.sub(transaction.gasPrice.mul(receipt.gasUsed)).add(100));
    })

    it('should get fees when party is early', async function () {
        const hodl = await MyEtherHODL.new();

        await web3.eth.sendTransaction({from: wallet1, to: hodl.address, value: 100});
        (await hodl.lockedUntil.call(wallet1)).toNumber().should.be.within(
            latestTime() + duration.years(1) - duration.minutes(1),
            latestTime() + duration.years(1)
        );

        increaseTime(duration.years(1) / 2);
        await advanceBlock();

        const ownerBalanceBefore = new BigNumber(web3.eth.getBalance(_));

        const balanceBefore = new BigNumber(web3.eth.getBalance(wallet1));
        const txid = await web3.eth.sendTransaction({from: wallet1, to: hodl.address, value: 0, data: dataParty});
        const transaction = await web3.eth.getTransaction(txid);
        const receipt = await web3.eth.getTransactionReceipt(txid);
        const balanceAfter = new BigNumber(web3.eth.getBalance(wallet1));

        const ownerBalanceAfter = new BigNumber(web3.eth.getBalance(_));

        balanceAfter.should.be.bignumber.equal(balanceBefore.sub(transaction.gasPrice.mul(receipt.gasUsed)).add(100 - 5));
        ownerBalanceAfter.should.be.bignumber.equal(ownerBalanceBefore.add(5));
    })

})
