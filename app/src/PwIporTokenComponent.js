import React, { useState } from "react";
import { newContextComponents } from "@drizzle/react-components";
import { Button } from "react-bootstrap";

const { ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => {
    const [assets, setAssets] = useState([""]);
    const [amounts, setAmounts] = useState(["0"]);

    return (
        <div>
            <br />
            <h3>
                Ipor Token <small>{drizzle.contracts.IporToken.address}</small>
            </h3>
            {assets}
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>My Balance of Ipor Token</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="IporToken"
                                method="balanceOf"
                                methodArgs={[drizzleState.accounts[0]]}
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>My allowances</strong>
                            <br />
                            <small>To PwToken</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="IporToken"
                                method="allowance"
                                methodArgs={[
                                    drizzleState.accounts[0],
                                    drizzle.contracts.PwIporToken.address,
                                ]}
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Set allowances</strong> <br />
                            <small>PwToken: {drizzle.contracts.PwIporToken.address}</small>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="IporToken" method="approve" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Transfer TOKENS to</strong>
                            <br />
                            <small>
                                for setup need to transfer 1000000000000000000000 ipor tokens to{" "}
                                <br /> Liquidity Rewards {drizzle.contracts.John.address}
                            </small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="IporToken"
                                method="transfer"
                            />
                        </td>
                    </tr>
                </table>
                <br />
            </div>
            <br />
            <br />
            <h3>
                Power Ipor <small>{drizzle.contracts.PwIporToken.address}</small>
            </h3>
            <br />
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>Set John address</strong>
                            <br />
                            <small>John address: {drizzle.contracts.John.address}</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="john"
                                render={(value) =>
                                    value !== "0x0000000000000000000000000000000000000000" ? (
                                        value
                                    ) : (
                                        <b>Not setup</b>
                                    )
                                }
                            />
                            <br />
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="setJohn"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Total Supply</strong> <br />
                            <small>(base tokens)</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="totalSupplyBase"
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Total Supply</strong> <br />
                            <small>(power tokens)</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="totalSupply"
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>My Balance</strong> <br />
                            <small>(power tokens)</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="balanceOf"
                                methodArgs={[drizzleState.accounts[0]]}
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Delegated balance</strong> <br />
                            <small>power tokens delegated to liquidity rewards</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="delegatedBalanceOf"
                                methodArgs={[drizzleState.accounts[0]]}
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Exchange Rate</strong> <br />
                            <small>between base token and pwToken</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="calculateExchangeRate"
                                render={(value) => (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Withdrawal fee</strong> <br />
                            <small>this fee is charged during unstake</small>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="getWithdrawFee"
                                render={(value) => (
                                    <div>
                                        {value / 10000000000000000} %
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Set withdrawal fee</strong> <br />
                            <small>represented in 18 decimals</small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="setWithdrawalFee"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Stake</strong>
                            <br />
                            <small>
                                Stake iporToken into PwIporToken contract, <br />
                                represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm drizzle={drizzle} contract="PwIporToken" method="stake" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Unstake</strong>
                            <br />
                            <small>
                                unStake pwToken into PwIporToken contract, <br />
                                represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="unstake"
                            />
                        </td>
                    </tr>
                    <tr style={{ padding: "1em" }}>
                        <td>
                            <strong>Delegate power ipor to John</strong> <br />
                            Assets: <br />
                            <small>
                                ipUsdt: {drizzle.contracts.IpTokenUsdt.address}, <br />
                                ipUsdc: {drizzle.contracts.IpTokenUsdc.address}, <br />
                                ipDai: {drizzle.contracts.IpTokenDai.address}, <br />
                                amounts represented in 18 decimals, <br />
                                example for two assets: <br />
                                assets:
                                {drizzle.contracts.IpTokenUsdt.address},
                                {drizzle.contracts.IpTokenUsdc.address}
                                <br />
                                amounts: 10000000000000000000,20000000000000000000
                            </small>
                        </td>
                        <td>
                            <tr style={{ border: "none" }}>
                                <td>
                                    <label htmlFor="Assets"> Assets: </label>
                                </td>
                                <td style={{ border: "none", padding: "1em" }}>
                                    <input
                                        id="assets"
                                        value={assets.join(",")}
                                        onChange={(e) => setAssets(e.target.value.split(","))}
                                    />
                                </td>
                            </tr>
                            <tr style={{ border: "none" }}>
                                <td>
                                    <label> Amounts: </label>
                                </td>
                                <td style={{ border: "none", padding: "1em" }}>
                                    <input
                                        id="amounts"
                                        value={amounts.map((e) => e.toString()).join(",")}
                                        onChange={(e) =>
                                            setAmounts(
                                                e.target.value.split(",")
                                                // .map((a) => (a != "" ? BigNumber.from(a) : ""))
                                            )
                                        }
                                    />
                                </td>
                            </tr>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="delegateToJohn"
                                render={({ handleSubmit, inputs, state, handleInputChange }) => {
                                    state["assets"] = assets;
                                    state["amounts"] = amounts;
                                    return (
                                        <div>
                                            <form
                                                className="pure-form pure-form-stacked"
                                                onSubmit={handleSubmit}
                                            >
                                                <button
                                                    key="submit"
                                                    className="pure-button"
                                                    type="button"
                                                    onClick={handleSubmit}
                                                >
                                                    Submit
                                                </button>
                                            </form>
                                        </div>
                                    );
                                }}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Withdraw power ipor from John</strong> <br />
                            Assets: <br />
                            <small>
                                ipUsdt: {drizzle.contracts.IpTokenUsdt.address}, delegated balance{" "}
                                <br />
                                <ContractData
                                    drizzle={drizzle}
                                    drizzleState={drizzleState}
                                    contract="John"
                                    method="userParams"
                                    methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                                    render={(value) => {
                                        return (
                                            <span>
                                                {value[3] / 1000000000000000000} - {value[3]}{" "}
                                            </span>
                                        );
                                    }}
                                />
                                <br />
                                ipUsdc: {drizzle.contracts.IpTokenUsdc.address}, delegated balance{" "}
                                <br />
                                <ContractData
                                    drizzle={drizzle}
                                    drizzleState={drizzleState}
                                    contract="John"
                                    method="userParams"
                                    methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                                    render={(value) => {
                                        return (
                                            <span>
                                                {value[3] / 1000000000000000000} - {value[3]}{" "}
                                            </span>
                                        );
                                    }}
                                />
                                <br />
                                ipDai: {drizzle.contracts.IpTokenDai.address}, delegated balance{" "}
                                <br />
                                <ContractData
                                    drizzle={drizzle}
                                    drizzleState={drizzleState}
                                    contract="John"
                                    method="userParams"
                                    methodArgs={[drizzle.contracts.IpTokenDai.address]}
                                    render={(value) => {
                                        return (
                                            <span>
                                                {value[3] / 1000000000000000000} - {value[3]}{" "}
                                            </span>
                                        );
                                    }}
                                />
                                <br />
                                amounts represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="withdrawFromDelegation"
                            />
                        </td>
                    </tr>
                </table>
            </div>

            <br />
            <br />
            <h3>
                <small>Cool down</small>
            </h3>
            <br />
            <br />
            <div className="row">
                <table className="table" align="center">
                    <tr>
                        <td>
                            <strong>Active Cool down</strong>
                        </td>
                        <td>
                            <ContractData
                                drizzle={drizzle}
                                drizzleState={drizzleState}
                                contract="PwIporToken"
                                method="activeCoolDown"
                                render={(value) => (
                                    <div>
                                        <table>
                                            <tr style={{ border: "none", "padding-left": "1rem" }}>
                                                <td>when cool down finish</td>
                                                <td style={{ "padding-left": "1rem" }}>
                                                    {value[0] == 0
                                                        ? "-"
                                                        : new Date(
                                                              value[0] * 1000
                                                          ).toLocaleDateString() +
                                                          " " +
                                                          new Date(
                                                              value[0] * 1000
                                                          ).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                            <tr style={{ border: "none", "padding-left": "1rem" }}>
                                                <td>Amount</td>
                                                <td style={{ "padding-left": "1rem" }}>
                                                    {value[1] / 1000000000000000000}
                                                    <br />
                                                    <small>{value[1]}</small>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                )}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Set cool down</strong> <br />
                            <small>
                                Amount of pwTokens to cool down, <brr />
                                represented in 18 decimals
                            </small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="coolDown"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Cancel cool down</strong>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="cancelCoolDown"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Redeem cool down</strong>
                            <br />
                            <small>Could be execute when cool down finish</small>
                        </td>
                        <td>
                            <ContractForm
                                drizzle={drizzle}
                                contract="PwIporToken"
                                method="redeem"
                            />
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    );
};
