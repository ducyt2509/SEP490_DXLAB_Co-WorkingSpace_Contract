// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DXLABCoin is ERC20, Ownable {
    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("DXLAB Coin", "DXL") {}

    function mintForUser(address user, uint256 amount) external onlyOwner {
        require(user != address(0), "Invalid address");
        _mint(user, amount);
        emit TokensMinted(user, amount);
    }
}
