import {
  Autocomplete,
  Button,
  CircularProgress,
  Grid,
  TextField,
} from "@mui/material";
import axios from "axios";
import debounce from "lodash/debounce";
import { prettyPrintJson } from 'pretty-print-json';
import { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const User_Selected_Plan = ["PICK_IN_STORE", "ON_DEMAND", "STANDARD"];

  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [authToken, setAuthToken] = useState("");
  const [profileData, setProfileData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  const fetchProducts = async (query = "") => {
    try {
      const response = await axios.get(
        "https://gsm-marketplace-back-gsm-back-develop.apps.gsmapp.dev/api/v1/products/",
        {
          params: {
            page_size: 10,
            page: 1,
            q: query,
          },
        }
      );
      setProducts(response.data?.results || []);
    } catch (error) {
      console.error(error);
      setProducts([]);
    }
  };

  async function fetchAddresses(authToken) {
    const response = await axios.get(
      "https://gsm-marketplace-back-gsm-back-develop.apps.gsmapp.dev/api/v1/address/user-address/",
      {
        params: {
          page_size: 10,
          page: 1,
        },

        headers: {
          Authorization: authToken,
        },
      }
    );
    return response.data;
  }
  async function fetchProfile(authToken) {
    try {
      const response = await axios.get(
        "https://gsm-marketplace-back-gsm-back-develop.apps.gsmapp.dev/api/v1/user/profile/",
        {
          params: {
            page_size: 10,
            page: 1,
          },

          headers: {
            Authorization: authToken,
          },
        }
      );
      setProfileData(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  const handleSubmitSearch = async () => {
    if (!selectedProduct || !selectedAddress) {
      alert("Please select product, address");
      return;
    }

    try {
      const body = {
        user_address_id: selectedAddress.id,
        product_id: selectedProduct.id,
        user_selected_plan: selectedPlan,
      };
      const response = await axios.post(
        "https://gsm-marketplace-back-gsm-back-develop.apps.gsmapp.dev/api/v1/dispatch/dispatch-options/",
        body,
        {
          headers: {
            Authorization: authTokenFromStorage,
            "Content-Type": "application/json",
          },
        }
      );
      setApiResponse(response.data);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const authTokenFromStorage = localStorage.getItem("authToken") && localStorage.getItem("authToken").length ?  localStorage.getItem("authToken") : null

  useEffect(() => {
    if (authTokenFromStorage) {
      fetchAddresses(authTokenFromStorage).then((data) => {
        setAddresses(data?.results);
      });
      fetchProfile(authTokenFromStorage);
    }
  }, [authTokenFromStorage]);

  const debouncedFetchProducts = useMemo(
    () => debounce(fetchProducts, 1000),
    []
  );

  const handleProductInputChange = (event, value, reason) => {
    if (reason === "input") {
      debouncedFetchProducts(value);
    }
  };

  const slotProps = {
    paper: {
      sx: {
        bgcolor: "#f5f5f5", // background color
        color: "black", // text color
        boxShadow: 3, // material shadow
        borderRadius: 2, // rounded corners
        fontSize: "0.875rem", // font size
        textAlign: "right", // optional: text inside to right
      },
    },
    popper: {
      sx: {
        zIndex: 1300, // if you need it to be over dialogs, etc.
        textAlign: "right", // right align the popper
        fontSize: "0.875rem", // font size
      },
    },
    listbox: {
      sx: {
        padding: 1,
        fontSize: "0.875rem", // font size
        "& .MuiAutocomplete-option": {
          padding: "10px",
          borderBottom: "1px solid #ddd",
          "&:hover": {
            bgcolor: "#e0e0e0",
          },
        },
      },
    },
  };

  return (
    <>
      <div
        style={{
          textAlign: "left",
          fontSize: "20px",
          fontWeight: "bold",
          marginBottom: "3rem",
        }}
      >
        order search test
      </div>
      <TextField
        id="outlined-basic"
        label="Authorization Code"
        variant="outlined"
        defaultValue={authTokenFromStorage ?? "Bearer ..."}
        sx={{ mb: 2, width: 1000 }}
        onChange={(e) => {
          setAuthToken(e.target.value);
        }}
      />
      <Button
        variant="outlined"
        sx={{ mb: 8, display: "block" }}
        onClick={() => {
          localStorage.setItem("authToken", authToken);
          fetchAddresses(authToken).then((data) => {
            setAddresses(data?.results);
          });
        }}
      >
        Authorize
      </Button>
      <div
        style={{
          textAlign: "left",
          fontSize: "14px",
          fontWeight: "bold",
          border: "1px solid #ddd",
          borderRadius: "5px",
          marginBottom: "2rem",
          padding: "10px",
        }}
      >
        <div>
          user-name: {profileData?.first_name}
          {profileData?.last_name}
        </div>
        <div
          style={{
            textAlign: "left",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          user-phoneNumber: {profileData?.phone_number}
        </div>
      </div>
      {profileData?.phone_number && (
        <>
          <Grid container spacing={2}>
            <Grid item size={6}>
              <Autocomplete
                loading={!products.length}
                disablePortal
                options={products}
                getOptionLabel={(option) =>
                  `${option.title}  /  pID:${option.id}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product-Id"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {!products.length ? (
                            <CircularProgress color="primary" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                slotProps={slotProps}
                onInputChange={handleProductInputChange}
                onChange={(event, newValue) => setSelectedProduct(newValue)}
              />
            </Grid>
            <Grid item size={6}>
              <Autocomplete
                disablePortal
                loading={!addresses.length}
                options={addresses}
                getOptionLabel={(option) =>
                  `${option.line1}  /  pID:${option.id}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Address-Id"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {!addresses.length ? (
                            <CircularProgress color="primary" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                slotProps={slotProps}
                onChange={(event, newValue) => setSelectedAddress(newValue)}
              />
            </Grid>
            <Grid item size={6}>
              <Autocomplete
                disablePortal
                options={User_Selected_Plan}
                renderInput={(params) => (
                  <TextField {...params} label="User-Selected-Plan" />
                )}
                slotProps={slotProps}
                onChange={(event, newValue) => setSelectedPlan(newValue)}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            sx={{ mb: 8, display: "block", marginTop: "1rem" }}
            onClick={() => {
              handleSubmitSearch();
            }}
          >
            submit search
          </Button>
        </>
      )}
      {apiResponse && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ textAlign: "left" }}>API Response:</h2>
          <div
         dir="ltr"
         style={{textAlign:'left'}}
            dangerouslySetInnerHTML={{
              __html: prettyPrintJson.toHtml(apiResponse, {   indent:  3 ,    
                lineNumbers:    true,  //wrap HTML in an <ol> tag to support line numbers
                // quoteKeys:      true,  //always double quote key names
                trailingCommas: true,  //append a comma after the last item in arrays and objects}), // Render the pretty JSON
            })}}
          />
        </div>
      )}
    </>
  );
}

export default App;
