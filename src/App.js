
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Web3 from "web3";
import detectEthereumProvider from '@metamask/detect-provider'
import { loadContract } from "./utils/load-contract";


function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null
  })

  const [balance, setBallance] = useState(null)
  const [account, setAccount] = useState(null)
  const [shouldReload, reload] = useState(false)

  const canConnectToContract = account && web3Api.contract
  const reloadEffect = useCallback(() => reload(!shouldReload), [shouldReload])

  const setAccountListener = provider => {
    provider.on("accountsChanged", _ => window.location.reload())
    provider.on("chainChanged", _ => window.location.reload())
  }

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider()

      if (provider) {
        const contract = await loadContract("Faucet", provider)
        setAccountListener(provider)
        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract,
          isProviderLoaded: true
        })
      } else {
        setWeb3Api(api => ({...api, isProviderLoaded: true}))
        console.error("Please, install Metamask.")
      }
    }

    loadProvider()
  }, [])

  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api
      const balance = await web3.eth.getBalance(contract.address)
      setBallance(web3.utils.fromWei(balance, "ether"))
    }

    web3Api.contract && loadBalance()
  }, [web3Api, shouldReload])

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts()
      setAccount(accounts[0])
    }

    web3Api.web3 && getAccount()
  }, [web3Api.web3])

    const addFunds = useCallback(async () => {
    const { contract, web3 } = web3Api
    const donated = document.getElementById("Donate-value").value
    ClearFields()

    await contract.addFunds({
      from: account,
      value: web3.utils.toWei(donated, "ether")
    })

    reloadEffect()
  }, [web3Api, account, reloadEffect])

  const withdraw = async () => {
    const { contract, web3 } = web3Api
    const withdrawed = document.getElementById("Withdraw-value").value
    const withdrawAmount = web3.utils.toWei(withdrawed, "ether")
    ClearFields()

    await contract.withdraw(withdrawAmount, {
      from: account
    })
    reloadEffect()
  }
  function onlyNumberKey(evt) {
              
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
        return false;
    return true;
}

function ClearFields() {

  document.getElementById("Donate-value").value = "";
  document.getElementById("Withdraw-value").value = "";
}

  return (
    <>
      <div className="faucet-wrapper">
        <div className="faucet">
          { web3Api.isProviderLoaded ?
            <div className="is-flex is-align-items-center">
              <span>
                <strong className="mr-2 has-text-white">Account: </strong>
              </span>
              
                { account ?
                  <div className="has-text-success">{account}</div> :
                  !web3Api.provider ?
                  <>
                    <div className="notification is-warning is-7 is-rounded">
                      Wallet is not detected!{` `}
                      <a
                        rel="noreferrer"
                        target="_blank"
                        href="https://docs.metamask.io">
                        Install Metamask
                      </a>
                    </div>
                  </> :
                  <button
                    className="button is-small button is-danger is-rounded"
                    onClick={() =>
                      web3Api.provider.request({method: "eth_requestAccounts"}
                    )}
                  >
                    Connect Wallet
                  </button>
                }
            </div> :
            <span>Looking for Web3...</span>
          }
          <div className="balance-view is-size-2 my-4 has-text-white">
            Current Balance: <strong className="has-text-white">{balance}</strong> ETH
          </div>
          { !canConnectToContract &&
            <i className="is-block">
              Connect to Ganache
            </i>
          }
          <div className="mb-4 is-flex is-align-items-center">
            <button
              disabled={!canConnectToContract}
              onClick={addFunds}
              className="button is-info is-rounded mr-5">
                Donate
            </button>
            <input class="input is-rounded"
                    id="Donate-value"
                    type="number" 
                    placeholder="Enter the amount here" 
                    onkeypress="return onlyNumberKey(event)"
                    min="0" 
                    maxlength="11" ></input>
          </div>
          <div className="is-flex is align- items-center">
            <button
              disabled={!canConnectToContract||balance==0}
              onClick={withdraw}
              className="button is-info is-rounded mr-2">Withdraw
            </button>
            <input class="input is-rounded" 
                    id="Withdraw-value"
                    type="number"  
                    placeholder="Enter the amount here (max 10 eth)"
                    onkeypress="return onlyNumberKey(event)" 
                    max={balance}
                    maxlength="11"></input>

          </div>
        </div>
      </div>
    </>
  );
}

export default App;


