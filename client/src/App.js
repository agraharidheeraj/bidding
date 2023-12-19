// App.js
import "./App.css";
import io from "socket.io-client";
import { useEffect, useState } from "react";
import { Box, Button, Input, Text, VStack } from "@chakra-ui/react";

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
    console.log(bid)
    setSelectedBid(bid);
  };

  const placeBid = () => {
    handleSelectBid();
    console.log(selectedBid,bidAmount)
    if (selectedBid && bidAmount) {
      console.log(
        `Placing bid for item ${selectedBid.id} with amount $${bidAmount}`
      );
      socket.emit("placeBid", {
        bidId: selectedBid.id,
        amount: bidAmount,
        user: socket.id,
        name: userName,
      });
      setBidAmount("");
    } else {
      console.log("Bid not selected or bid amount is empty");
    }
  };

  const confirmBid = (bidId) => {
    socket.emit("confirmBid", { bidId, user: socket.id });
  };

  useEffect(() => {
    socket.on("receive_bids", (data) => {
      setBids(data);
    });

    socket.on("bidPlaced", (data) => {
      // Handle bid amount received by the user who created the bid
      console.log(
        `Bid Amount: $${data.amount} from ${data.sender} for bid ${data.bidId}`
      );

      // Update the bids with the new bid information
      setBids((prevBids) => {
        return prevBids.map((bid) => {
          if (bid.id === data.bidId) {
            const updatedBid = {
              ...bid,
              bids: [...bid.bids, { name: data.sender, amount: data.amount }],
            };
            return updatedBid;
          }
          return bid;
        });
      });
    });
  }, []);

  return (
    <div className="App">
      <Box>
        <VStack spacing={4}>
          <Input
            size="sm"
            width="200px"
            placeholder="Item Name"
            onChange={(event) => setItemName(event.target.value)}
          />
          <Input
            size="sm"
            width="200px"
            placeholder="Item Price"
            onChange={(event) => setItemPrice(event.target.value)}
          />
          <Input
            size="sm"
            width="200px"
            placeholder="Your Name"
            onChange={(event) => setUserName(event.target.value)}
          />
          <Button colorScheme="blue" onClick={createBid}>
            Create Bid
          </Button>

          <Text fontSize="lg" fontWeight="bold">
            Bids:
          </Text>

          {bids.map((bid) => (
            <Box
              key={bid.id}
              borderWidth="1px"
              borderRadius="md"
              p={2}
              width="100%"
            >
              <Text>{`Item: ${bid.itemName}, Price: $${bid.itemPrice}`}</Text>
              <Text>{`Bidder: ${bid.name}`}</Text>
              {bid.confirmed ? (
                <Text color="green.500">Confirmed Bid!</Text>
              ) : (
                <>
                  {bid.user !== socket.id && (
                    <>
                      <Input
                        size="sm"
                        width="200px"
                        placeholder="Your Name"
                        onChange={(event) => setUserName(event.target.value)}
                      />
                      <Input
                        size="sm"
                        width="100px"
                        placeholder="Your Bid Amount"
                        value={bidAmount}
                        onChange={(event) => setBidAmount(event.target.value)}
                      />
                      <Button colorScheme="blue" onClick={placeBid}>
                        Place Bid
                      </Button>
                    </>
                  )}
                  {bid.user === socket.id && (
                    <Button
                      colorScheme="blue"
                      onClick={() => confirmBid(bid.id)}
                    >
                      Confirm Bid
                    </Button>
                  )}
                </>
              )}

              {/* Display bid amounts */}
              {bid.bids.map((bidData, index) => (
                <Text
                  key={index}
                >{`Bid Amount: $${bidData.amount} from ${bidData.name}`}</Text>
              ))}
            </Box>
          ))}
        </VStack>
      </Box>
    </div>
  );
}

export default App;
