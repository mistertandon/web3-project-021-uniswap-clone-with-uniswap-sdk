import React, { useState, useEffect, createContext } from "react";
import { ethers, BigNumber } from "ethers";
import Web3Modal from "web3modal";
import { BooTokenAddress, LifeTokenAddress, IWETHAddress } from "./constants";

import ERC20 from "./ERC20.json";
import { IWETHABI } from "./constants";

import {
  checkIfWalletConnected,
  connectWallet,
  connectingWithBooToken,
  connectingWithLifeToken,
  connectingWithSingleSwapToken,
  connectingWithSwapMultiHopToken,
  connectingWithIWETHToken,
  connectingWithDaiToken,
} from "./../Utils/appFeatures";

const SwapTokenContext = createContext({});

const SwapTokenContextProvider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [ether, setEther] = useState("");
  const [networkConnected, setNetworkConnected] = useState("");
  const [weth9, setWeth9] = useState("");
  const [dai, setDai] = useState("");
  const [tokenData, setTokenData] = useState([]);

  // const addToken = [BooTokenAddress, LifeTokenAddress, IWETHAddress];
  // BooToken Token deployed to 0x04f1A5b9BD82a5020C49975ceAd160E98d8B77Af
  // ERC20Life Token deployed to 0xde79380FBd39e08150adAA5C6c9dE3146f53029e
  // SingleSwapToken Token deployed to 0xbFD3c8A956AFB7a9754C951D03C9aDdA7EC5d638
  // SwapMultiHop Token deployed to 0x38F6F2caE52217101D7CA2a5eC040014b4164E6C
  const addToken = [
    "0x04f1A5b9BD82a5020C49975ceAd160E98d8B77Af",
    "0xde79380FBd39e08150adAA5C6c9dE3146f53029e",
    "0x04f1A5b9BD82a5020C49975ceAd160E98d8B77Af",
  ];

  const fetchingData = async () => {
    try {
      // Get User Account
      const userAccount = await checkIfWalletConnected();
      setAccount(userAccount);

      // Create provider
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      console.log("connection", connection);
      console.log("ethers", ethers);

      const provider = new ethers.providers.Web3Provider(connection);

      const balance = await provider.getBalance(userAccount);
      const convertedBigInt = BigNumber.from(balance).toString();
      // console.log(balance);
      const convertedEth = ethers.utils.formatEther(convertedBigInt);

      setEther(convertedEth);
      console.log("convertedEth", convertedEth);

      const network = await provider.getNetwork();
      console.log("network", network);
      setNetworkConnected(network.name);

      let tokensTemp = [];
      addToken.map(async (token, idx) => {
        const contract = new ethers.Contract(token, ERC20.abi, provider);
        console.log("contract : ", contract);

        const userBalance = await contract.balanceOf(userAccount);
        const tokenLeft = BigNumber.from(userBalance).toString();
        const convertokenBalance = ethers.utils.formatEther(tokenLeft);

        const symbol = await contract.symbol();
        const name = await contract.name();

        tokensTemp.push({ symbol, name, balance: convertokenBalance });

        console.log("userBalance : ", userBalance);
        console.log("convertokenBalance : ", convertokenBalance);
        console.log("symbol : ", symbol);
        console.log("name : ", name);
      });

      setTokenData(tokensTemp);
      console.log("tokensTemp : ", tokensTemp);

      // DAI Balance
      const daiContract = await connectingWithDaiToken();
      const daiBalance = await daiContract.balanceOf(userAccount);
      const daiToken = BigNumber.from(daiBalance).toString();
      const convertedDaiTokenBalance = ethers.utils.formatEther(daiToken);
      setDai(convertedDaiTokenBalance);

      // WETH9 Balance
      const weth9Contract = await connectingWithDaiToken();
      const weth9Balance = await weth9Contract.balanceOf(userAccount);
      const weth9Token = BigNumber.from(weth9Balance).toString();
      const convertedweth9TokenBalance = ethers.utils.formatEther(weth9Token);
      setWeth9(convertedweth9TokenBalance);

      console.log("dai State : ", convertedDaiTokenBalance);
      console.log("weth9 State : ", convertedweth9TokenBalance);
    } catch (error) {
      console.log("An error occured", error);
    }
  };

  useEffect(() => {
    fetchingData();
  }, []);

  const singleSwapToken = async () => {
    try {
      let singleSwapToken;
      let weth9Contract;
      let daiContract;

      singleSwapToken = await connectingWithSingleSwapToken();
      console.log("singleSwapToken", singleSwapToken);

      weth9Contract = await connectingWithIWETHToken();
      console.log("weth9Contract", weth9Contract);

      daiContract = await connectingWithDaiToken();
      console.log("daiContract", daiContract);

      const amountIn = 10n ** 18n;
      await weth9Contract.deposite({ value: amountIn });
      await weth9Contract.approve(singleSwapToken.address, amountIn);
      await singleSwapToken.swapExactInputSingle(amountIn, {
        gasLimit: 300000,
      });

      const balance = await daiContract.balanceOf(account);
      const transferAmount = BigNumber.from(balance).toString();
      const ethValue = ethers.utils.formatEther(transferAmount);
      setDai(ethValue);
      console.log("ethValue", ethValue);
    } catch (error) {
      console.log("Error", error);
    }
  };

  // useEffect(() => {
  //   singleSwapToken();
  // }, [singleSwapToken]);

  return (
    <SwapTokenContext.Provider
      value={{
        tokenName: "Parvesh",
        connectWallet,
        account,
        networkConnected,
        ether,
        weth9,
        dai,
        tokenData,
        singleSwapToken,
      }}
    >
      {children}
    </SwapTokenContext.Provider>
  );
};

export { SwapTokenContext as default, SwapTokenContextProvider };
