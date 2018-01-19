pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


contract MyEtherHODL is Ownable {

    event Hodl(address indexed hodler, uint indexed amount, uint untilTime);
    event Party(address indexed hodler, uint indexed amount);
    event Fee(address indexed hodler, uint indexed amount, uint elapsed);

    mapping (address => uint) public balanceOf;
    mapping (address => uint) public lockedUntil;
    
    function() public payable {
        hodlFor1y();
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
        lockedUntil[msg.sender] = now + duration;
        Hodl(msg.sender, msg.value, lockedUntil[msg.sender]);
    }

    function party() public {
        uint value = balanceOf[msg.sender];
        require(value > 0);
        balanceOf[msg.sender] = 0;

        if (now < lockedUntil[msg.sender] && msg.sender != owner) {
            uint fee = value * 5 / 100;
            owner.transfer(fee);
            value -= fee;
            Fee(msg.sender, fee, lockedUntil[msg.sender] - now);
        }
        
        msg.sender.transfer(value);
        Party(msg.sender, value);
        delete balanceOf[msg.sender];
        delete lockedUntil[msg.sender];
    }
}
