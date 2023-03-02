import React, { ReactNode, useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Link,
  Flex,
  Button,
  Spacer,
  HStack,
  Text,
  Container as ChakraContainer,
  StyleProps,
  Tooltip,
} from "@chakra-ui/react";

import { Logo } from "@cartridge/ui/src/components/brand/Logo";
import { WordLogo } from "@cartridge/ui/src/components/brand/Word";
import TimesIcon from "@cartridge/ui/src/components/icons/Times";
import { HeaderItem } from "@cartridge/ui/src/components/HeaderItem";
import { useAvatar } from "../hooks/avatar";
import { Loading } from "./Loading";
import Chain from "@cartridge/ui/src/components/menu/Chain";
import { constants, SequencerProvider, uint256 } from "starknet";
import { useBalanceQuery } from "../generated/graphql";
import {
  CONTRACT_ETH,
  CONTRACT_POINTS,
} from "@cartridge/controller/src/constants";
import { BigNumber, utils } from "ethers";
import Ether from "./icons/Ether";
import { Arrow } from "@cartridge/ui/components/Card";
import ArrowIcon from "@cartridge/ui/components/icons/Arrow";

const Container = ({
  height,
  children,
  ...rest
}: {
  height: string;
  children: React.ReactNode;
} & StyleProps) => (
  <>
    <Flex
      h={height}
      w="full"
      top="0"
      left="0"
      position="fixed"
      zIndex="overlay"
      align="center"
      justify="center"
      flexShrink={0}
      bg="gray.800"
      {...rest}
    >
      <ChakraContainer centerContent>{children}</ChakraContainer>
    </Flex>
    <Box h={height} />
  </>
);

export const Header = ({
  chainId,
  address,
  muted = false,
  onLogout,
  onClose,
  onBack,
}: {
  chainId?: constants.StarknetChainId;
  address?: string;
  muted?: boolean;
  onLogout?: () => void;
  onClose?: () => void;
  onBack?: () => void;
}) => {
  const [ethBalance, setEthBalance] = useState<string>();

  const pointsChain = "starknet:SN_GOERLI";
  const pointsTokenAccountId = `${pointsChain}/${pointsChain}:${
    address || ""
  }/erc20:${CONTRACT_POINTS}`;
  const { data: pointsData, error: pointsError } = useBalanceQuery({
    tokenAccountId: pointsTokenAccountId,
  });
  const points = pointsData?.balance?.balance;
  const { current, loading } = useAvatar(address || "", points || 10);

  useEffect(() => {
    if (address) {
      const provider = new SequencerProvider({
        network:
          chainId === constants.StarknetChainId.MAINNET
            ? "mainnet-alpha"
            : "goerli-alpha",
      });

      provider
        .callContract({
          contractAddress: CONTRACT_ETH,
          entrypoint: "balanceOf",
          calldata: [BigNumber.from(address).toString()],
        })
        .then((res) => {
          setEthBalance(
            utils.formatEther(
              uint256
                .uint256ToBN({
                  low: res.result[0],
                  high: res.result[1],
                })
                .toString(),
            ),
          );
        });
    }
  }, [address, chainId]);

  if (!address) {
    const fill = muted ? "gray.200" : "brand";

    return (
      <Container height="54px" bgColor="gray.700">
        <HStack w="full" justify="space-between">
          <Spacer maxW="42px" />
          <HStack spacing="0">
            <Logo fill={fill} w="24px" mr="15px" />
            <WordLogo fill={fill} h="18px" />
          </HStack>
          <Button
            h="30px"
            w="42px"
            variant="secondary450"
            visibility={!!onClose ? "visible" : "hidden"}
            onClick={onClose}
          >
            <TimesIcon boxSize="18px" />
          </Button>
        </HStack>
      </Container>
    );
  }

  let chainName = "Unknown";
  switch (chainId) {
    case constants.StarknetChainId.MAINNET:
      chainName = "Mainnet";
      break;
    case constants.StarknetChainId.TESTNET:
      chainName = "Testnet";
      break;
    case constants.StarknetChainId.TESTNET2:
      chainName = "Testnet 2";
      break;
  }

  return (
    <Container height="50px" bgColor="gray.700">
      <HStack w="full" h="full">
        {onBack ? (
          <HStack
            w="30px"
            h="30px"
            spacing="0"
            justify="center"
            onClick={onBack}
            data-group
            _hover={{
              cursor: "pointer",
            }}
          >
            <ArrowIcon
              fill="whiteAlpha.700"
              transform="rotate(180deg)"
              _groupHover={{
                fill: "white",
              }}
            />
          </HStack>
        ) : (
          <Logo fill="brand" w="24px" mr="15px" />
        )}
        <Spacer />
        <HStack spacing="6px">
          <Chain name={chainName} />
          <Box minW="70px">
            <HeaderItem>
              <Ether w="12px" h="12px" />
              {!!ethBalance && (
                <Text fontWeight="700" letterSpacing="0.05em">
                  {parseFloat(ethBalance).toFixed(3)}
                </Text>
              )}
              {!ethBalance && (
                <Loading fill="white" width="12px" height="12px" />
              )}
            </HeaderItem>
          </Box>
          {chainId && (
            <Tooltip label="Click to copy address" hasArrow arrowSize={15}>
              <Box
                onClick={() => {
                  navigator.clipboard.writeText(address);
                }}
                _hover={{
                  cursor: "pointer",
                }}
              >
                <HeaderItem bgColor="gray.500">
                  {loading ? (
                    <Loading fill="white" width="12px" height="12px" />
                  ) : (
                    <Box
                      w="18px"
                      h="18px"
                      dangerouslySetInnerHTML={
                        !!current?.svg ? { __html: current?.svg } : undefined
                      }
                    />
                  )}
                </HeaderItem>
              </Box>
            </Tooltip>
          )}
          <HStack
            w="24px"
            h="30px"
            justify="end"
            visibility={!!onClose ? "visible" : "hidden"}
            data-group
            _hover={{
              cursor: "pointer",
            }}
            onClick={onClose}
          >
            <TimesIcon
              boxSize="18px"
              fill="whiteAlpha.700"
              _groupHover={{
                fill: "white",
              }}
            />
          </HStack>
        </HStack>
      </HStack>
    </Container>
  );
};

export const SignupHeader = ({ children }: { children: ReactNode }) => {
  return (
    <Container height="64px" bgColor="gray.700">
      <HStack w="full" h="64px">
        <NextLink href="/">
          <Link>
            <Logo fill="brand" w="24px" mx="15px" />
          </Link>
        </NextLink>
        <Spacer />
        {children}
        <Spacer />
        <HStack spacing="10px"></HStack>
      </HStack>
    </Container>
  );
};
