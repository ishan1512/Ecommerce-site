//used for global state like user login logout etc
//zustand is  used for state management
import {create} from "zustand";
import axios from "../lib/axios.js";
import {toast} from "react-hot-toast";

export const useUserStore = create((set,get)=>({
    user:null,
    loading:false,
    checkingAuth:true,

    signup: async({name,email,password,confirmPassword})=>{
        set({loading:true});

        if(password !== confirmPassword){
            set({loading:false});
            return toast.error("Passwords do not match");
        }

        try {
            //here connecting or making req to backend
            const res = await axios.post("/auth/signup", {name,email,password});
            set({user: res.data, loading:false})
        } catch (error) {
            set({loading:false})
            toast.error(error.response.data.message || "An error occurred");
        }
    },

    login: async(email,password)=>{
        set({loading:true});

        try {
            //making request to backend login api
            const res = await axios.post("/auth/login", {email,password});
            set({user: res.data, loading:false})
        } catch (error) {
            set({loading:false});
            toast.error(error.response.data.message || "An error occurred")
        }
    },

    logout: async()=>{
        try {
            await axios.post("/auth/logout");
            set({user:null});
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred during logout")
        }
        
    },

    //check for auth when u refresh the page so that it doenst logout
    checkAuth: async()=>{
        set({checkingAuth:true});
        try {
            const res = await axios.get("/auth/profile");
            set({user:res.data, checkingAuth:false});
        } catch (error) {
            set({checkingAuth:false, user:null})
        }
    },  

    refreshToken: async() =>{
        //prevent multiple simultaneous refresh requests
        if(get().checkingAuth) return;
        set({checkingAuth:true});
        try {
            const res = await axios.post("/auth/refresh-token")
            set({checkingAuth:false});
            return res.data;
        } catch (error) {
            set({user: null, checkingAuth:false});
            throw error;
        }
    }
}))

//axios interceptors for refreshing the access tokens
//understand and learn this concept
let refreshPromise = null;
axios.interceptors.response.use(
    (response) => response,
    async (error) =>{
        const originalRequest = error.config;
        if(error.response?.status === 401 && !originalRequest._retry){
            originalRequest._retry = true;
            try {
                //if a refresh is already in progress, wait for it to finish
                if(refreshPromise){
                    await refreshPromise;
                    return axios(originalRequest);
                }

                //else start a new refresh process
                refreshPromise = useUserStore.getState().refreshToken();
                await refreshPromise;
                refreshPromise = null;

                return axios(originalRequest);
            } catch (refreshError) {
                //if refresh fails, logout and redirect to login page
                useUserStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
)