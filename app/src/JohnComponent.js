import React from "react";
import { newContextComponents } from "@drizzle/react-components";

const { ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => (
    <div>
        <br />
        <h3>John {drizzle.contracts.John.address} </h3>
        <br />
        <div className="row">
            <table className="table" align="center">
                <tr>
                    <th scope="col"></th>
                    <th scope="col">
                        ipUSDT
                        <br />
                        {drizzle.contracts.IpTokenUsdt.address}
                    </th>
                    <th scope="col">
                        ipUSDC
                        <br />
                        {drizzle.contracts.IpTokenUsdc.address}
                    </th>
                    <th scope="col">
                        ipDAI
                        <br />
                        {drizzle.contracts.IpTokenDai.address}
                    </th>
                </tr>
                <tr>
                    <td>
                        <strong>Liquidity Rewards Balance of ipTokens</strong>
                        <br />
                        <small>represented in 18 decimals</small>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenUsdt"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.John.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenUsdc"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.John.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenDai"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.John.address]}
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
                        <strong>Liquidity Rewards Balance of Ipor Token</strong>
                        <br />
                        <small>represented in 18 decimals</small>
                    </td>
                    <td colspan="3">
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IporToken"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.John.address]}
                            render={(value) => {
                                if (value == 0) {
                                    return (
                                        <strong>
                                            This should be > 0, go to power ipor and transfer tokens
                                        </strong>
                                    );
                                }
                                return (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>Global params</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getGlobalParams"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Aggregate power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Accrued rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[5] / 1000000000000000000}
                                                <br />
                                                <small>{value[5]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier in the Block</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier cumulative before block</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block number</td>
                                            <td style={{ "padding-left": "1rem" }}>{value[3]}</td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[4] / 100000000}
                                                <br />
                                                <small>{value[4]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getGlobalParams"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Aggregate power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Accrued rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[5] / 1000000000000000000}
                                                <br />
                                                <small>{value[5]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier in the Block</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier cumulative before block</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block number</td>
                                            <td style={{ "padding-left": "1rem" }}>{value[3]}</td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[4] / 100000000}
                                                <br />
                                                <small>{value[4]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getGlobalParams"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Aggregate power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Accrued rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[5] / 1000000000000000000}
                                                <br />
                                                <small>{value[5]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier in the Block</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier cumulative before block</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block number</td>
                                            <td style={{ "padding-left": "1rem" }}>{value[3]}</td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Block rewards</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[4] / 100000000}
                                                <br />
                                                <small>{value[4]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                </tr>

                <tr>
                    <td>
                        <strong>Rewards per block</strong>
                        <br />
                        <small>represented in 8 decimals</small>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getRewardsPerBlock"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 100000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getRewardsPerBlock"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 100000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getRewardsPerBlock"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 100000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>Set rewards per block</strong> <br />
                        <small>
                            Assets: <br />
                            ipUsdt, ipUsdc, ipDai <br />
                            amount represented in 8 decimals, <br /> 1 = 100 000 000
                        </small>
                    </td>
                    <td colSpan="2">
                        <ContractForm
                            drizzle={drizzle}
                            contract="John"
                            method="setRewardsPerBlock"
                        />
                    </td>
                </tr>
            </table>

            <br />
            <h3>User data</h3>
            <br />

            <table className="table" align="center">
                <tr>
                    <th scope="col">My allowances</th>
                    <th scope="col">ipUSDT</th>
                    <th scope="col">ipUSDC</th>
                    <th scope="col">ipDAI</th>
                </tr>
                <tr>
                    <td>
                        <strong> John</strong>
                        <br />
                        <small>
                            For provide liquidity: {drizzle.contracts.John.address}
                            <br />
                            amount:
                            115792089237316195423570985008687907853269984665640564039457584007913129639935
                        </small>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenUsdt"
                            method="allowance"
                            methodArgs={[drizzleState.accounts[0], drizzle.contracts.John.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenUsdc"
                            method="allowance"
                            methodArgs={[drizzleState.accounts[0], drizzle.contracts.John.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="IpTokenDai"
                            method="allowance"
                            methodArgs={[drizzleState.accounts[0], drizzle.contracts.John.address]}
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
                    <td></td>
                    <td>
                        <ContractForm drizzle={drizzle} contract="IpTokenUsdt" method="approve" />
                    </td>
                    <td>
                        <ContractForm drizzle={drizzle} contract="IpTokenUsdc" method="approve" />
                    </td>
                    <td>
                        <ContractForm drizzle={drizzle} contract="IpTokenDai" method="approve" />
                    </td>
                </tr>
            </table>

            <table className="table" align="center">
                <tr>
                    <th scope="col"></th>
                    <th scope="col">
                        ipUSDT
                        <br />
                        {drizzle.contracts.IpTokenUsdt.address}
                    </th>
                    <th scope="col">
                        ipUSDC
                        <br />
                        {drizzle.contracts.IpTokenUsdc.address}
                    </th>
                    <th scope="col">
                        ipDAI
                        <br />
                        {drizzle.contracts.IpTokenDai.address}
                    </th>
                </tr>
                <tr>
                    <td>
                        <strong>My params</strong>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getAccountParams"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier cumulative</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Staked ipTokens</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Delegated powerToken</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[3] / 1000000000000000000}
                                                <br />
                                                <small>{value[3]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getAccountParams"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier cumulative</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Staked ipTokens</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Delegated powerToken</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[3] / 1000000000000000000}
                                                <br />
                                                <small>{value[3]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="getAccountParams"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
                            render={(value) => {
                                return (
                                    <table>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Power up</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[2] / 1000000000000000000}
                                                <br />
                                                <small>{value[2]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Composite multiplier cumulative</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[0] / 1000000000000000000000000000}
                                                <br />
                                                <small>{value[0]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Staked ipTokens</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[1] / 1000000000000000000}
                                                <br />
                                                <small>{value[1]}</small>
                                            </td>
                                        </tr>
                                        <tr style={{ border: "none", "padding-left": "1rem" }}>
                                            <td>Delegated powerToken</td>
                                            <td style={{ "padding-left": "1rem" }}>
                                                {value[3] / 1000000000000000000}
                                                <br />
                                                <small>{value[3]}</small>
                                            </td>
                                        </tr>
                                    </table>
                                );
                            }}
                        />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>My IpToken Balance</strong>
                        <br />
                        <small>
                            Balance of ipTokens owned by user, <br /> represented in 18 decimals
                        </small>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="CockpitDataProvider"
                            method="getMyIpTokenBalance"
                            methodArgs={[drizzle.contracts.DrizzleUsdt.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="CockpitDataProvider"
                            method="getMyIpTokenBalance"
                            methodArgs={[drizzle.contracts.DrizzleUsdc.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="CockpitDataProvider"
                            method="getMyIpTokenBalance"
                            methodArgs={[drizzle.contracts.DrizzleDai.address]}
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
                        <strong>My Stake IpToken Balance</strong>
                        <br />
                        <small>
                            balance of staked ipTokens by user, <br /> represented in 18 decimals
                        </small>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => (
                                <div>
                                    {value / 1000000000000000000}
                                    <br />
                                    <small>{value}</small>
                                </div>
                            )}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="balanceOf"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
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
                        <strong>My Delegated power token balance</strong>
                        <br />
                        <small>
                            Balance of pwTokens delegated from power token contract, <br />
                            represented in 18 decimals
                        </small>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="balanceOfDelegatedPwIpor"
                            methodArgs={[
                                drizzleState.accounts[0],
                                [drizzle.contracts.IpTokenUsdt.address],
                            ]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value[0][0]["amount"] / 1000000000000000000}
                                        <br />
                                        <small>{value[0][0]["amount"]}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="balanceOfDelegatedPwIpor"
                            methodArgs={[
                                drizzleState.accounts[0],
                                [drizzle.contracts.IpTokenUsdc.address],
                            ]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value[0][0]["amount"] / 1000000000000000000}
                                        <br />
                                        <small>{value[0][0]["amount"]}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="balanceOfDelegatedPwIpor"
                            methodArgs={[
                                drizzleState.accounts[0],
                                [drizzle.contracts.IpTokenDai.address],
                            ]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value[0][0]["amount"] / 1000000000000000000}
                                        <br />
                                        <small>{value[0][0]["amount"]}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                </tr>

                <tr>
                    <td>
                        <strong>My Rewards</strong>
                        <br />
                        <small>
                            Amount of rewards which user can claim from liquidity rewards contract
                            <br /> represented in 18 decimals
                        </small>
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="calculateAccountRewards"
                            methodArgs={[drizzle.contracts.IpTokenUsdt.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="calculateAccountRewards"
                            methodArgs={[drizzle.contracts.IpTokenUsdc.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                    <td>
                        <ContractData
                            drizzle={drizzle}
                            drizzleState={drizzleState}
                            contract="John"
                            method="calculateAccountRewards"
                            methodArgs={[drizzle.contracts.IpTokenDai.address]}
                            render={(value) => {
                                console.error(value);
                                return (
                                    <div>
                                        {value / 1000000000000000000}
                                        <br />
                                        <small>{value}</small>
                                    </div>
                                );
                            }}
                        />
                    </td>
                </tr>

                <tr>
                    <td>
                        <strong>Claim</strong> <br />
                        <small>
                            Assets: ipUsdt, ipUsdc, ipDai
                            <br />
                        </small>
                    </td>
                    <td colspan="2">
                        <ContractForm drizzle={drizzle} contract="John" method="claim" />
                    </td>
                </tr>
                <tr>
                    <th scope="col"></th>
                    <th scope="col"></th>
                </tr>

                <tr>
                    <td>
                        <strong>Stake</strong>
                        <br />
                        <small>
                            Stake ipToken into John contract <br /> Assets: ipUsdt, ipUsdc, ipDai
                        </small>
                    </td>
                    <td colspan="2">
                        <ContractForm drizzle={drizzle} contract="John" method="stake" />
                    </td>
                </tr>
                <tr>
                    <td>
                        <strong>Unstake</strong>
                        <br />
                        <small>
                            Unstake ipToken from John contract <br /> Assets: ipUsdt, ipUsdc, ipDai
                        </small>
                    </td>
                    <td colspan="2">
                        <ContractForm drizzle={drizzle} contract="John" method="unstake" />
                    </td>
                </tr>
            </table>
        </div>
    </div>
);
