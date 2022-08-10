import React from "react";
import { newContextComponents } from "@drizzle/react-components";

const { ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => (
    <div>
        <br />
        <h3>IporToken <small>{drizzle.contracts.IporToken.address}</small></h3>
        <br />
        <div className="row">
            <table className="table" align="center">
                <tr>
                    <td>
                        <strong>My IporToken Balance</strong>
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
                        <strong>My allowances for PwIporToken</strong>
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
                <td colspan="2">
                        <ContractForm drizzle={drizzle} contract="IporToken" method="approve" />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>Transfer TOKENS to</strong>
                    </td>
                    <td>
                    <ContractForm drizzle={drizzle} contract="IporToken" method="transfer" />
                    </td>
                </tr>
            </table>
            <br />
            </div>
            <br />
        <br />
        <h3>PwIporToken <small>{drizzle.contracts.PwIporToken.address}</small></h3>
        <br />
        <br />
        <div className="row">
        <table className="table" align="center">
                <tr>
                    <td>
                        <strong>My PwIporToken Balance</strong>
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
                        <strong>Exchange Rate</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="PwIporToken"
                            method="exchangeRate"
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
                        <strong>Stake</strong>
                        <br />
                        <small>Stake iporToken into PwIporToken contract</small>
                    </td>
                    <td>
                        <ContractForm
                            drizzle={drizzle}
                            contract="PwIporToken"
                            method="stake"
                        />
                    </td>
                </tr>
            </table>
        </div>
    </div>
);
