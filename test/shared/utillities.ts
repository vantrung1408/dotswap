import { BigNumber, Contract, ethers } from 'ethers'
import {
  defaultAbiCoder,
  keccak256,
  parseUnits,
  solidityPack,
  toUtf8Bytes,
} from 'ethers/lib/utils'
import { EthereumProvider } from 'hardhat/types'

const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes(
    'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'
  )
)

export function getDomainSeparator(
  name: string,
  tokenAddress: string,
  chainId: number
) {
  return keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        keccak256(
          toUtf8Bytes(
            'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
          )
        ),
        keccak256(toUtf8Bytes(name)),
        keccak256(toUtf8Bytes('1')),
        chainId,
        tokenAddress,
      ]
    )
  )
}

export async function getApprovalDigest(
  token: Contract,
  approve: {
    owner: string
    spender: string
    value: BigNumber
  },
  nonce: BigNumber,
  deadline: BigNumber,
  chainId: number
): Promise<string> {
  const name = await token.name()
  const DOMAIN_SEPARATOR = getDomainSeparator(name, token.address, chainId)
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [
              PERMIT_TYPEHASH,
              approve.owner,
              approve.spender,
              approve.value,
              nonce,
              deadline,
            ]
          )
        ),
      ]
    )
  )
}

export async function mineBlock(
  provider: EthereumProvider,
  timestamp: number
): Promise<void> {
  await new Promise(async (resolve, reject) => {
    provider.sendAsync(
      {
        id: 1,
        method: 'evm_mine',
        jsonrpc: '2.0',
        params: [timestamp - 1],
      },
      (error: any, result: any): void => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )
  })
}

export function encodePrice(reserve0: BigNumber, reserve1: BigNumber) {
  return [
    reserve1.mul(BigNumber.from(2).pow(112)).div(reserve0),
    reserve0.mul(BigNumber.from(2).pow(112)).div(reserve1),
  ]
}

export const expandTo18Decimals = (value: number) =>
  parseUnits(value.toString(), 18)

export const bigNumberify = (value: any) => BigNumber.from(value)

export const MINIMUM_LIQUIDITY = bigNumberify(10).pow(3)
