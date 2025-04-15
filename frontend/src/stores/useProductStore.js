import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useProductStore = create((set)=>({
    //our initial states
    products:[],
    loading:false,

    //our setter function
    setProducts:(products)=> set({products}),

    createProduct: async (productData) =>{
        set({loading:true});
        try {
            const res = await axios.post("/products", productData)
            //we can have many products so we want to add latest product to the products so we do this
            //we have previosState(previous product) and add latest product on top of it
            set((previousState) =>({
                products:[...previousState.products, res.data],
                loading:false,
            }))
            toast.success("Product created successfully")
        } catch (error) {
            toast.error(error.response.data.error);
            set({loading:false});
        }
    },

    fetchAllProducts: async() =>{
        set({loading:true});
        try {
            const res = await axios.get("/products");
            set({products:res.data.products, loading:false})
        } catch (error) {
            set({error:"Failed to fetch products", loading:false})
            toast.error(error.response.data.error || "Failed to fetch products");
        }
    },

    fetchProductsByCategory: async(category) => {
        set({loading:true});
        try {
            const res = await axios.get(`/products/category/${category}`)
            set({products:res.data.products, loading:false})
        } catch (error) {
            set({error: "Failed to fetch products", loading:false})
            toast.error(error.response.data.error || "Failed to fetch products")
        }
    },

    deleteProduct: async(productId) =>{
        set({loading:true});
        try {
            await axios.delete(`/products/${productId}`);
            set((previousProducts)=>({
                products: previousProducts.products.filter((product) => product._id !== productId),
                loading:false,
            }))
        } catch (error) {
            set({loading:false});
            toast.error(error.response.data.error || 'Failed to delete product')
        }
    },

    toggleFeaturedProduct: async(productId) =>{
        set({loading:true});
        try {
            const res = await axios.patch(`/products/${productId}`);
            //this will update the isFeatured property of the product
            set((previousProduct) =>({
                products: previousProduct.products.map((product)=>
                    product._id === productId ? {...product, isFeatured: res.data.isFeatured} : product
                ),
                loading: false,
            }))
        } catch (error) {
            set({loading:false});
            toast.error(error.response.data.error || "Failed to update product")
        }
    },

    fetchFeaturedProducts: async()=>{
        set({loading:true});
        try {
            const res = await axios.get("/products/featured");
            set({products: res.data, loading:false})
        } catch (error) {
            set({error: "Failed to fetch products", loading:false});
            console.log("Error in featured products", error);
        }
    },
}))