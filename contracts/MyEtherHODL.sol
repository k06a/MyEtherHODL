pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


contract MyEtherHODL is Ownable {

    event Hodl(address indexed hodler, uint indexed amount, uint untilTime);
    event Party(address indexed hodler, uint indexed amount);
    event Fee(address indexed hodler, uint indexed amount, uint elapsed);

    mapping (address => uint) public balanceOf;
    mapping (address => uint) public lockedUntil;
    
    function() public payable {
        if (balanceOf[msg.sender] > 0) {
            hodlFor(0); // Do not extend time-lock
        } else {
            hodlFor(1 years);
        }
    }

    function hodlFor1y() public payable {
        hodlFor(1 years);
    }

    function hodlFor2y() public payable {
        hodlFor(2 years);
    }

    function hodlFor3y() public payable {
        hodlFor(3 years);
    }

    function hodlFor(uint duration) internal {
        balanceOf[msg.sender] += msg.value;
        if (duration > 0) { // Extend time-lock if needed only
            lockedUntil[msg.sender] = now + duration;
        }
        Hodl(msg.sender, msg.value, lockedUntil[msg.sender]);
    }

    function party() public {
        partyTo(msg.sender);
    }

    function partyTo(address hodler) public {
        uint value = balanceOf[hodler];
        require(value > 0);
        balanceOf[hodler] = 0;

        if (now < lockedUntil[hodler]) {
            require(msg.sender == hodler);
            uint fee = value * 5 / 100;
            owner.transfer(fee);
            value -= fee;
            Fee(hodler, fee, lockedUntil[hodler] - now);
        }
        
        hodler.transfer(value);
        Party(hodler, value);
        delete balanceOf[hodler];
        delete lockedUntil[hodler];
    }
}
