import hre from "hardhat";
import chai from "chai";
import { Signer, BigNumber } from "ethers";
import { IpToken, IporToken } from "../../../types";

import { assertError } from "../../utils/AssertUtils";
import { prepareTestDataForMining } from "../../utils/DataUtils";
import { N1__0_18DEC } from "../../utils/Constants";

const keccak256 = require("keccak256");
const { expect } = chai;

describe("IporToken", () => {
    let admin: Signer,
        userOne: Signer,
        userTwo: Signer,
        userThree: Signer,
        liquidityProvider: Signer;

    before(async () => {
        [admin, userOne, userTwo, userThree, liquidityProvider] = await hre.ethers.getSigners();
    });

    after(async () => {
        [admin, userOne, userTwo, userThree, liquidityProvider] = await hre.ethers.getSigners();
    });

    const preperateTestDataCase01 = async (): Promise<{
        ipToken: IpToken;
        iporToken: IporToken;
    }> => {
        const testData = await prepareTestDataForMining(
            BigNumber.from(Math.floor(Date.now() / 1000)),
            [admin, userOne, userTwo, userThree, liquidityProvider],
            ["DAI"]
        );

        const { ipTokenDai, iporToken } = testData;

        if (ipTokenDai === undefined || iporToken === undefined) {
            throw new Error("Setup Error");
        } else {
            return { ipToken: ipTokenDai, iporToken };
        }
    };

    // it("Should ", async () => {
    //     //    given
    //     const name = "io.ipor.ipor.token";
    //     //    when
    //     const x = keccak256("eip1967.proxy.implementation").toString("hex");
    //     console.table({
    //         result: x,
    //         powinno: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
    //         0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbd
    //     });
    //     //    then
    // });
    // io.ipor.ipor.token
    // 0x1381a7188760c470320204bcfd7e56fb198c5c4148f74567e6369a65320a6d7d
    //-1
    // 0x1381a7188760c470320204bcfd7e56fb198c5c4148f74567e6369a65320a6d7c
    // io.ipor.power.token
    // 0x47fdc87a43122e85126f7506d5be29962db3a4c77842c5853eec80d72b414528
    // -1
    // 0x47fdc87a43122e85126f7506d5be29962db3a4c77842c5853eec80d72b414527
    // io.ipor.john
    //  0xa93ed28ba51624c3ccbf684cac0148c79cb9ca9719ef9f44335ff76641461b14
    // -1
    //  0xa93ed28ba51624c3ccbf684cac0148c79cb9ca9719ef9f44335ff76641461b13

    it("should contain 18 decimals", async () => {
        //given
        const { iporToken } = await preperateTestDataCase01();
        const expectedDecimals = BigNumber.from("18");

        //when
        const actualDecimals = await iporToken.decimals();

        //then
        expect(
            expectedDecimals,
            `Incorrect decimals actual: ${actualDecimals}, expected: ${expectedDecimals}`
        ).to.be.equal(actualDecimals);
    });

    it("should not sent ETH to IporToken", async () => {
        //given
        const { iporToken } = await preperateTestDataCase01();

        await assertError(
            //when
            admin.sendTransaction({
                to: iporToken.address,
                value: hre.ethers.utils.parseEther("1.0"),
            }),
            //then
            "Transaction reverted: function selector was not recognized and there's no fallback nor receive function"
        );
    });

    it("should contain initially 1 000 000 tokens in 18 decimals", async () => {
        //given
        const { iporToken } = await preperateTestDataCase01();
        const expectedTotalSupply = BigNumber.from("100000000").mul(N1__0_18DEC);

        //when
        const actualTotalSupply = await iporToken.totalSupply();

        //then
        expect(
            expectedTotalSupply,
            `Incorrect total supply actual: ${actualTotalSupply}, expected: ${expectedTotalSupply}`
        ).to.be.equal(actualTotalSupply);
    });

    it("should deployer contain initially 1 000 000 tokens in 18 decimals which is equal total supply", async () => {
        //given
        const { iporToken } = await preperateTestDataCase01();
        const expectedDeployerBalance = BigNumber.from("100000000").mul(N1__0_18DEC);

        //when
        const actualDeployerBalance = await iporToken.balanceOf(await admin.getAddress());
        const actualTotalSupply = await iporToken.totalSupply();

        //then
        expect(
            expectedDeployerBalance,
            `Incorrect deployer balance actual: ${actualDeployerBalance}, expected: ${expectedDeployerBalance}`
        ).to.be.equal(actualDeployerBalance);

        expect(
            expectedDeployerBalance,
            `Deployer balance is different than total supply, but should be the same.`
        ).to.be.equal(actualTotalSupply);
    });
});
