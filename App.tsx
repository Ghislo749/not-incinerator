// ------------------------- // -------------------------------------------------------- // ------------------------------- //
// ------------------------- //              React App to burn Nothing token             // ------------------------------- //
// ------------------------- // -------------------------------------------------------- // ------------------------------- //

// -------------------------------------------------------- //
// ------------- IMPORT PACKAGES & COMPONENTS ------------- //
// -------------------------------------------------------- //

import { useEffect, useRef, useState } from "react";
import { AppConfig, UserSession, openContractCall, showConnect } from '@stacks/connect';
import { StacksMainnet } from "@stacks/network";
import { uintCV, principalCV, tupleCV, noneCV, StacksTransaction, PostConditionMode } from '@stacks/transactions';

import burnChrome from "./images/burn-chrome.png";
import searchIcon from "./images/input-icon.png"

import "./App.css";


// --------------------------------------------- //
// ------------- DECLARE CONSTANTS ------------- //
// --------------------------------------------- //

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });
const mainnet = new StacksMainnet();

// change this constants according to needs (currently placeholders until the contract is deployed on chain)
const contractAddress = 'SP2QF5522FB9Y4X35TPGX29H7F4EMH5RSZV27X7FH';
const contractName = 'nothing-burner';
const functionNameBurn = 'burn-nothing';

const description = `By burning any amount of $NOT you'll receive a commemorative NFT in your wallet.
<span style="color: red; font-size:15px;">WARNING:</span> Burning $NOT tokens is irreversible, once you commit to the burn you won't be able to retrieve your tokens!!`;

// Struct to debug data of sent tx
interface FinishData {
  stacksTransaction: StacksTransaction;
  txId: string;
  txRaw: string;
}

function App() {

  const inputRef = useRef<HTMLInputElement>(null);

  const [isInputHovered, setIsInputHovered] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);
  const [inputText, setInputText] = useState("");

  const [authenticated, setAuthenticated] = useState(false);
  const [userPrincipal, setUserPrincipal] = useState('');
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);

  // --------------------------------------------- //
  // ----------------- FUNCTIONS ----------------- //
  // --------------------------------------------- //

  // Connect wallet function
  function authenticate() {
    showConnect({
      appDetails: {
        name: 'test',
        icon: window.location.origin + '',
      },
      redirectTo: '/',
      onFinish: () => {
        setAuthenticated(true);
        const userData = userSession.loadUserData();
        setUserPrincipal(userData?.profile?.stxAddress.mainnet);
      },
      userSession: userSession,
    });
  }

  // Get balance function
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.mainnet.hiro.so/extended/v1/address/' + userPrincipal + '/balances');
        const data = await response.json();
        if (
          data.fungible_tokens &&
          data.fungible_tokens["SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope::NOT"]
        ) {
          setBalance(
            parseInt(
              data.fungible_tokens["SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope::NOT"].balance
            )
          );
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // show error loading balance data and reload page button
      }
    };

    if (userPrincipal !== "") {
      fetchData();
    }

  }, [userPrincipal]);

  // Input amount functions
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/\D/g, "");
    const inputAmount = parseFloat(input);
    const newInputText = input === "0" || input === "" ? "" : inputAmount <= balance ? inputAmount.toLocaleString() : balance.toLocaleString();
    setInputText(newInputText);
  };

  useEffect(() => {
    const newAmount = parseFloat(inputText.replace(/,/g, ""));
    console.log(newAmount);
    setAmount(newAmount);
  }, [inputText]);

  const handleInputClick = () => {
    inputRef.current?.focus();
  };

  const handleInputBarFocus = () => {
    setIsInputActive(true);
  };

  const handleInputBarBlur = () => {
    setIsInputActive(false);
  };


  // Burn button function  (currently placeholders until the contract is deployed on chain)
  async function handleBurnClick() {

    const functionArgs = [
      tupleCV({
        to: principalCV(contractAddress),
        amount: uintCV(amount),
        memo: noneCV()
      })
    ];

    const options = {
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: functionNameBurn,
      functionArgs: functionArgs,
      appDetails: {
        name: 'test',
        icon: '',
      },
      network: mainnet,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data: FinishData) => {
        console.log('Stacks Transaction:', data.stacksTransaction);
        console.log('Transaction ID:', data.txId);
        console.log('Raw transaction:', data.txRaw);
        const explorerTransactionUrl = `https://explorer.stacks.co/txid/${data.txId}`;
        const receiptTransactionUrl = `https://api.mainnet.hiro.so/extended/v1/tx/${data.txId}`;
        console.log('View transaction in explorer:', explorerTransactionUrl);
        console.log('View transaction receipt:', receiptTransactionUrl);
      },
    };
    await openContractCall(options);
  }

  // ------------------------------------------- //
  // ------------- RENDER FUNCTION ------------- //
  // ------------------------------------------- //

  return (


    <div className="home-container">

      {authenticated ? (
        <>
          <button className="auth-button" disabled>{userPrincipal}</button>
        </>
      ) : (
        <button className="auth-button" onClick={authenticate}>Authenticate</button>
      )}

      <div className="burn-panel-wrapper">
        <img src={burnChrome} alt="chrome1" className="burn-chrome" />
        <div className="burn-panel-rect">
          <div className="burn-panel-container">
            <div className="burn-title-text"> $NOT Incinerator</div>
            <div className="burn-panel-line" />
            <div className="burn-descr-text" dangerouslySetInnerHTML={{ __html: description }} />
            <div className="input-container" onMouseEnter={() => setIsInputHovered(true)} onMouseLeave={() => setIsInputHovered(false)} onClick={handleInputClick}>
              <div className={`input-rect1 ${isInputHovered || isInputActive ? "active" : ""}`} />
              <div className="input-rect2" />
              <div className="input-rect3" >
                <img src={searchIcon} alt="sIcon" className="input-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onFocus={handleInputBarFocus}
                  onBlur={handleInputBarBlur}
                  className="input-input"
                  placeholder="Input amount to burn..."
                />
              </div>
            </div>
            <div className="balance-text">Balance: {balance.toLocaleString()}</div>

            <div className="burn-button" onClick={handleBurnClick}>BURN</div>
            <div className="burn-descr-text">You will burn {amount} $NOT</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App


