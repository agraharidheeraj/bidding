import "./App.css";
import io from "socket.io-client";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Card,
  CardBody,
  Flex,
} from "@chakra-ui/react";

const socket = io.connect("http://localhost:3001", {
  transports: ["websocket"],
});

function App() {
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [userName, setUserName] = useState("");
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [sellerData, setSellerData] = useState(null);
  const [isBidConfirmed, setIsBidConfirmed] = useState(false);

  const createBid = () => {
    const newBid = {
      itemName,
      itemPrice,
      user: socket.id,
      name: userName,
    };

    socket.emit("createBid", newBid);
  };

  const handleSelectBid = (bid) => {
    setSelectedBid(bid);
  };

  const placeBid = (bid) => {
    handleSelectBid(bid);
    if (bidAmount) {
      socket.emit("placeBid", {
        bidId: bid.id,
        amount: bidAmount,
        user: socket.id,
        name: userName,
      });
      setBidAmount("");
    } else {
      console.log("Bid not selected or bid amount is empty");
    }
  };

  const confirmBid = (bidData, bidId) => {
    setSellerData({ name: bidData.name, amount: bidData.amount });
    socket.emit("confirmBid", { bidId, user: socket.id });
    setIsBidConfirmed(true);
  };

  useEffect(() => {
    socket.on("receive_bids", (data) => {
      setBids(data);
    });

    socket.on("bidPlaced", (data) => {
      console.log(
        `Bid Amount: $${data.amount} from ${data.sender} for bid ${data.bidId}`
      );

      // Update the bids with the new bid information
      setBids((prevBids) => {
        return prevBids.map((bid) => {
          if (bid.user === data.bidId) {
            console.log(bid.user);
            const updatedBid = {
              ...bid,
              isBidConfirmed: false,
              bids: [...bid.bids, { name: data.sender, amount: data.amount }],
            };
            return updatedBid;
          }
          return bid;
        });
      });
    });

    socket.on("bidConfirmed", (data) => {
      setSellerData({ name: data.name, amount: data.amount });
    });
  }, []);

  return (
    <div className="App">
      <Box>
        <VStack mt={6} spacing={4}>
          <Box width="100%">
            <Text fontSize="40px" fontFamily="monospace" fontWeight={600}>
              Car Bidding
            </Text>
          </Box>

          <Card width="400px">
            <CardBody
              alignItems="center"
              display="flex"
              flexDirection="column"
              gap="1rem"
            >
              <Input
                size="sm"
                width="80%"
                placeholder="Item Name..."
                borderRadius="5px"
                onChange={(event) => setItemName(event.target.value)}
              />
              <Input
                size="sm"
                width="80%"
                placeholder="Item Price..."
                borderRadius="5px"
                onChange={(event) => setItemPrice(event.target.value)}
              />
              <Input
                size="sm"
                borderRadius="5px"
                width="80%"
                placeholder="Your Name"
                onChange={(event) => setUserName(event.target.value)}
              />
              <Button colorScheme="blue" onClick={createBid}>
                Create Bid
              </Button>
            </CardBody>
          </Card>
          <Text fontSize="lg" fontWeight="bold">
            Bidding List
          </Text>

          {bids.map((bid) => (
            <Box>
              <Box
                key={bid.id}
                borderWidth="1px"
                borderRadius="md"
                p={2}
                width="400px"
                justifyContent="space-between"
                alignItems="center"
                marginBottom={4}
              >
                <Flex justifyContent="center" align="center" direction="column">
                  <Flex align="center">
                    <Text fontSize="20px" fontWeight={600} mr={3}>
                      Item :
                    </Text>
                    <Text>{` ${bid.itemName}`}</Text>
                  </Flex>
                  <Flex align="center">
                    <Text fontSize="20px" fontWeight={600} mr={3}>
                      Price :
                    </Text>
                    <Text>{`$${bid.itemPrice}`}</Text>
                  </Flex>
                  <Flex align="center">
                    <Text fontSize="20px" mr={3} fontWeight={600}>
                      Bidder Name :
                    </Text>
                    <Text>{`${bid.name}`}</Text>
                  </Flex>
                </Flex>
              </Box>
              {bid.confirmed ? (
                <Text color="green.500">
                  {`The item is sold to ${sellerData?.name} with this $${sellerData?.amount} amount`}
                </Text>
              ) : (
                <>
                  {bid.user !== socket.id && (
                    <>
                      <Flex align="center" gap={4} direction="column">
                        <Flex gap={4}>
                          <Input
                            size="sm"
                            width="200px"
                            placeholder="Your Name"
                            onChange={(event) =>
                              setUserName(event.target.value)
                            }
                          />
                          <Input
                            size="sm"
                            width="180px"
                            placeholder="Your Bid Amount"
                            onChange={(event) =>
                              setBidAmount(event.target.value)
                            }
                          />
                        </Flex>
                        <Button
                          width="200px"
                          colorScheme="blue"
                          onClick={() => placeBid(bid)}
                        >
                          Place Bid
                        </Button>
                      </Flex>
                    </>
                  )}
                </>
              )}

              {/*  socket.id === bidData.user || */}
              {bid.bids.map((bidData, index) =>
                socket.id === bid.user
                  ? !isBidConfirmed && (
                      <>
                      <Text fontSize='20px' color='red.600' fontWeight={600}>Bidding List of Other user</Text>
                        <Text
                          key={index}
                        >{`Bid Amount: $${bidData.amount} from ${bidData.name}`}</Text>

                        <Button
                          colorScheme="blue"
                          onClick={() => confirmBid(bidData, bid.id)}
                        >
                          Confirm Bid
                        </Button>
                      </>
                    )
                  : ""
              )}
            </Box>
          ))}
        </VStack>
      </Box>
    </div>
  );
}

export default App;
