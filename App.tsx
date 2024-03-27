// ------------------------- // -------------------------------------------------------- // ------------------------------- //
// ------------------------- //              React App to burn Nothing token             // ------------------------------- //
// ------------------------- // -------------------------------------------------------- // ------------------------------- //

// -------------------------------------------------------- //
// ------------- IMPORT PACKAGES & COMPONENTS ------------- //
// -------------------------------------------------------- //

import { useEffect, useRef, useState } from "react";
import { AppConfig, UserSession, openContractCall, showConnect } from '@stacks/connect';
import { StacksMainnet } from "@stacks/network";
import { uintCV, StacksTransaction, PostConditionMode, serializeCV , cvToValue } from '@stacks/transactions';

import burnChrome from "./images/burn-chrome.png";
import searchIcon from "./images/input-icon.png";
import notWhiteX from "./images/whitex.png";

import "./App.css";
import { deserialize } from "@stacks/transactions/dist/cl";


// --------------------------------------------- //
// ------------- DECLARE CONSTANTS ------------- //
// --------------------------------------------- //

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });
const mainnet = new StacksMainnet();

const contractAddress = 'SPEMB0KQRD7PWKY2W2J2Y1Y6Q9YBJ702DWQADE7V';
const contractName = 'not-incinerator-v3';
const functionNameBurn = 'burn-nothing';
const maxAmount = 10000000;

const description = `By burning any amount of $NOT you'll receive a commemorative NFT in your wallet.
To prevent sad mistakes, you can burn max 10,000,000 NOT with each transaction.
<span style="color: red; font-size:15px;">WARNING:</span> Burning $NOT tokens is irreversible, once you commit to the burn you won't be able to retrieve your tokens!!`;

// Struct to debug data of sent tx
interface FinishData {
  stacksTransaction: StacksTransaction;
  txId: string;
  txRaw: string;
}

// Burners list struct
interface BurnerData {
  burnerAddress: string;
  burnerAmount: number;
}

// Error modal component
interface ErrorModalProps {
  reloadPage: () => void; 
}

const ErrorModal: React.FC<ErrorModalProps> = ({ reloadPage }) => {
  return (
    <div className="error-modal">
      <p>Error loading data. Please try again.</p>
      <button onClick={reloadPage}>Reload Page</button>
    </div>
  );
};

// Burners List modal component
function BurnersModal({ burnersList, onClose }: { burnersList: BurnerData[], onClose: () => void }) {
  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation(); 
  };

  return (
    <div className="modal-background" onClick={onClose}>
      <div className="burners-panel-rect" onClick={handlePanelClick}>
        <div className="burners-list">
          <h2>Burners List</h2>
          <div className="tot-line"/>
          <ul>
            {burnersList.map((burner, index) => (
              <li key={index}>
                {burner.burnerAddress}     -     {burner.burnerAmount.toLocaleString()} $NOT
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
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
  const [totBurned, setTotBurned] = useState(0);
  const [totBurns, setTotBurns] = useState(0)
  const [burnersList, setBurnersList] = useState<BurnerData[]>([])

  const [showBurnersModal, setShowBurnersModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const reloadPage = () => {
    window.location.reload();
  };

  
  // --------------------------------------------- //
  // ----------------- FUNCTIONS ----------------- //
  // --------------------------------------------- //

  // Connect function
  function authenticate() {
    showConnect({
      appDetails: {
        name: 'Nothing Incinerator',
        icon: 'https://bafkreieug75i7f74at6gailpsox52lgs2ct7zccht5nobik3giv4opkeuu.ipfs.dweb.link/',
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

  // Get NOT balance function
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
        setShowErrorModal(true);
      }
    };

    if (userPrincipal !== "") {
      fetchData();
    }

  }, [userPrincipal]);

  // Get Tot burned NOT function
  useEffect(() => {
    const fetchData2 = async () => {
      try {
        const response = await fetch('https://api.mainnet.hiro.so/v2/contracts/call-read/SPEMB0KQRD7PWKY2W2J2Y1Y6Q9YBJ702DWQADE7V/not-incinerator-v3/get-burned-amount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: 'SPEMB0KQRD7PWKY2W2J2Y1Y6Q9YBJ702DWQADE7V',
            arguments: []
          })
        });

        const data = await response.json();
        if (data.okay && data.result) {
          const hexString = data.result.substring(6);
          const decimalNumber = parseInt(removeLeadingZeros(hexString), 16);
          setTotBurned(decimalNumber);
        } else {
          setShowErrorModal(true);
        }
      } catch (error) {
        setShowErrorModal(true);
      }
    };

    if (totBurned === 0) {
      fetchData2();
    }
  }, [totBurned]);

  const removeLeadingZeros = (hexString: string): string => {
    let index = 0;
    while (hexString[index] === '0') {
      index++;
    }
    return hexString.substring(index);
  };

  // Get Tot Burns and Burners List data
  useEffect(() => {

    // Get Tot Burns
    const fetchData3 = async () => {
      try {
        const response = await fetch('https://api.mainnet.hiro.so/v2/contracts/call-read/SPEMB0KQRD7PWKY2W2J2Y1Y6Q9YBJ702DWQADE7V/not-incinerator-v3/get-tot-burns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: 'SPEMB0KQRD7PWKY2W2J2Y1Y6Q9YBJ702DWQADE7V',
            arguments: []
          })
        });

        const data = await response.json();
        if (data.okay && data.result) {
          const hexString = data.result.substring(6);
          const decimalNumber = parseInt(removeLeadingZeros(hexString), 16);
          setTotBurns(decimalNumber);
        } else {
          setShowErrorModal(true);
        }
      } catch (error) {
        setShowErrorModal(true);
      }
    };

    // Get Burners List data
    const fetchData4 = async (index: number): Promise<BurnerData> =>{
      try {

        const clarityValue = uintCV(index);
        const serializedClarityValue = serializeCV(clarityValue);

        let hexString = '';
        for (const byte of serializedClarityValue) {
            hexString += ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }

        const response = await fetch('https://api.mainnet.hiro.so/v2/contracts/call-read/SPEMB0KQRD7PWKY2W2J2Y1Y6Q9YBJ702DWQADE7V/not-incinerator-v3/get-burns-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: 'SPEMB0KQRD7PWKY2W2J2Y1Y6Q9YBJ702DWQADE7V',
            arguments: [hexString]
          })
        });

        const data = await response.json();
        if (data.okay && data.result) {
         
          const clarityValue = deserialize(data.result);
          const valueResult = cvToValue(clarityValue);
          const { value } = valueResult;
          const amount = value?.value?.amount?.value || ''; 
          const maker = value?.value?.maker?.value || '';
          const burnerData: BurnerData = {
            burnerAddress: maker,
            burnerAmount: parseInt(amount)
          };
    
          return burnerData;
        } else {
          setShowErrorModal(true);
          throw [];
        }
      } catch (error) {
        setShowErrorModal(true);
        throw error;
      }
    };

    const fetchDataForAll = async () => {
      const tempBurnersList: BurnerData[] = [];
      for (let i = 0; i < totBurns; i++) {
        const data = await fetchData4(i);
        tempBurnersList.push(data);
      }
      setBurnersList(tempBurnersList);
    };

    if (totBurns === 0) {
      fetchData3();
    } else if (totBurns > 0) {
      fetchDataForAll();
    }
  }, [totBurns]);

  // Input amount functions
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/\D/g, "");
    const inputAmount = parseFloat(input);
    let newInputText = "";
    if (balance < maxAmount) {
      newInputText = input === "0" || input === "" ? "" : 
        inputAmount <= balance ? inputAmount.toLocaleString() : balance.toLocaleString();
    } else {
      newInputText = input === "0" || input === "" ? "" : 
        inputAmount <= maxAmount ? inputAmount.toLocaleString() : maxAmount.toLocaleString();
    }  
    setInputText(newInputText);
  };

  useEffect(() => {
    const newAmount = parseFloat(inputText.replace(/,/g, ""));
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


  // Burn button function
  async function handleBurnClick() {

    if (!authenticated) {
      return;
    }

    const functionArgs = [
      uintCV(amount)
    ];

    const options = {
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: functionNameBurn,
      functionArgs: functionArgs,
      appDetails: {
        name: 'Not Incinerator',
        icon: 'https://bafkreieug75i7f74at6gailpsox52lgs2ct7zccht5nobik3giv4opkeuu.ipfs.dweb.link/',
      },
      network: mainnet,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data: FinishData) => {
        const explorerTransactionUrl = `https://explorer.stacks.co/txid/${data.txId}?chain=mainnet`;
        const receiptTransactionUrl = `https://api.mainnet.hiro.so/extended/v1/tx/${data.txId}`;
        console.log('View transaction receipt:', receiptTransactionUrl);
        window.open(explorerTransactionUrl, '_blank');
      },
    };
    await openContractCall(options);
  }

  // Handle Burners List Modal

  const handleBurnersTextClick = () => {
    setShowBurnersModal(true);
  };

  const handleCloseModal = () => {
    setShowBurnersModal(false);
  };

  
  // ------------------------------------------- //
  // ------------- RENDER FUNCTION ------------- //
  // ------------------------------------------- //

  return (
    <div className="home-container">
      
      { /* Auth Button */}
      {authenticated ? (
        <>
          <button className="auth-button" disabled>{userPrincipal}</button>
        </>
      ) : (
        <button className="auth-button" onClick={authenticate}>Authenticate</button>
      )}

      { /* Error Modal */}
      {showErrorModal && <ErrorModal reloadPage={reloadPage} />}

      { /* Total Burned Component */}
      <div className="tot-wrapper2">
      <img src={notWhiteX} alt="not" className="not-img" />
        <div className="tot-wrapper">
          <div className="tot-burned-text">Total $NOT incinerated</div>
          <div className="tot-line"/>
          <div className="tot-burned-text2">{totBurned.toLocaleString()}</div>
        </div>
        <img src={notWhiteX} alt="not" className="not-img" />
      </div>

      { /* Burn Panel Component */}
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
            <div className="burn-descr-text">You will burn {amount.toLocaleString()} $NOT</div>
          </div>
        </div>
      </div>

      { /* Burners List Text-Button + Modal */}
      <div className="burners-text" onClick={handleBurnersTextClick}>Show $NOT Burners list</div>
      {showBurnersModal && <BurnersModal burnersList={burnersList} onClose={handleCloseModal} />}
    </div>
  );
}

export default App
