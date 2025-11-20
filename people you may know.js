import { arrayUnion, arrayRemove, auth, collection, db, doc, getDocs, onAuthStateChanged, query, setDoc, updateDoc, signOut, where, getDoc } from "./config.js";

window.logout = () => {
    signOut(auth).then(() => {
        window.location.href = "./login.html";
    }).catch((error) => {
        console.log(error);
    });
}

async function getUsers(currentUserId) {
    const usersContainer = document.getElementById("friendsList");
    usersContainer.innerHTML = "";

    // Current user ka data get kar raha ho taake check kar saken ke kon se friends already requested hain  
    const currentUserRef = doc(db, "users", currentUserId);  
    const currentUserSnap = await getDoc(currentUserRef);  
    const currentUserData = currentUserSnap.exists() ? currentUserSnap.data() : {};  
    
    // Dono arrays get karo - friend requests aur existing friends
    const myFriendRequests = currentUserData.friendRequest || []; // Mere ko aaye hue friend requests
    const myFriends = currentUserData.friends || []; // Mere existing friends
    const mySentRequests = currentUserData.sentRequests || []; // Mere bheje hue friend requests

    // CHANGED: Cleanup karo - jo users already friends hain unko sentRequests se remove karo
    await cleanupSentRequests(currentUserId, myFriends, mySentRequests);

    const q = query(collection(db, "users"), where("userId", "!=", currentUserId));

    const querySnapshot = await getDocs(q);
    
    // CHANGED: Updated sentRequests array get karo cleanup ke baad
    const updatedCurrentUserSnap = await getDoc(currentUserRef);
    const updatedCurrentUserData = updatedCurrentUserSnap.exists() ? updatedCurrentUserSnap.data() : {};
    const updatedSentRequests = updatedCurrentUserData.sentRequests || [];

    querySnapshot.forEach((doc) => {
        const user = doc.data();
        const { firstName, lastName, email, userId } = user || {}

        // CHANGED: Pehle check karo ke kya ye user already friend hai
        if (myFriends.includes(userId)) {
            // Agar already friend hai to skip karo - show nahi karo
            return;
        }

        // CHANGED: Check karo ke kya maine is user ko already request bheji hai
        if (updatedSentRequests.includes(userId)) {
            // Agar maine request bheji hai to skip karo - show nahi karo
            return;
        }

        // CHANGED: Check karo ke kya is user ne mujhe request bheji hai
        if (myFriendRequests.includes(userId)) {
            // Agar usne mujhe request bheji hai to skip karo - show nahi karo
            return;
        }

        // CHANGED: Sirf wohi users show karo jinko maine request nahi bheji aur jo mere friends nahi hain
        let buttonText, buttonClass, buttonFunction;

        buttonText = "Add Friend";
        buttonClass = "px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition";
        buttonFunction = `addFriend('${currentUserId}','${userId}')`;

        usersContainer.innerHTML += `
        <div id="user-${userId}" class="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition">
            <div class="flex items-center gap-4">
                <img src="https://i.pravatar.cc/100?img=11" alt="${firstName} ${lastName}"
                    class="h-14 w-14 rounded-full object-cover">
                <div>
                    <h3 class="text-lg font-semibold">${firstName} ${lastName}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${email}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onClick ="${buttonFunction}"
                    class="${buttonClass}" id="btn-${userId}">
                    ${buttonText}
                </button>
            </div>
        </div>`
    });
}

// CHANGED: Naya function jo sentRequests array cleanup karta hai
async function cleanupSentRequests(currentUserId, friends, sentRequests) {
    try {
        // Find karo kon se sent requests wale users already friends ban chuke hain
        const requestsToRemove = sentRequests.filter(request => friends.includes(request));
        
        // Agar koi aisa request hai jo remove karna hai
        if (requestsToRemove.length > 0) {
            const myRef = doc(db, 'users', currentUserId);
            
            // Har ek friend ke liye jo already ban gaya hai, unko sentRequests se remove karo
            for (const friendId of requestsToRemove) {
                await updateDoc(myRef, {
                    sentRequests: arrayRemove(friendId)
                });
                console.log(`Removed ${friendId} from sentRequests as they are now friends`);
            }
            
            // CHANGED: Return karo ke cleanup hua ya nahi
            return true;
        }
        return false;
    } catch (error) {
        console.log("Error cleaning up sent requests:", error);
        return false;
    }
}

window.addFriend = async (currentUserId, friendId) => {
    try {
        console.log(currentUserId, friendId)

        // Friend ke document mein request add karo
        const friendRef = doc(db, 'users', friendId);
        await updateDoc(friendRef, {
            friendRequest: arrayUnion(currentUserId)
        });

        // Apne document mein bhi track karo ke maine kon ko request bheji hai
        const myRef = doc(db, 'users', currentUserId);
        await updateDoc(myRef, {
            sentRequests: arrayUnion(friendId)
        });

        // CHANGED: Poori list refresh karne ki bajaye sirf button update karo
        updateButtonToCancel(currentUserId, friendId);

    } catch (error) {
        console.log("Error adding friend:", error);
    }
}

// CHANGED: Friend request accept karne ka alag function banaya
window.acceptFriendRequest = async (currentUserId, friendId) => {
    try {
        console.log("Accepting friend request:", currentUserId, friendId);

        // CHANGED: Pehle current user ka data get karo
        const currentUserRef = doc(db, "users", currentUserId);
        const currentUserSnap = await getDoc(currentUserRef);
        const currentUserData = currentUserSnap.exists() ? currentUserSnap.data() : {};
        const myFriends = currentUserData.friends || [];
        const mySentRequests = currentUserData.sentRequests || [];

        // Friend ke friends array mein current user add karo
        const friendRef = doc(db, "users", friendId);
        await updateDoc(friendRef, {
            friends: arrayUnion(currentUserId),
            friendRequest: arrayRemove(currentUserId) // Friend request se remove karo
        });

        // Apne friends array mein friend add karo
        const myRef = doc(db, "users", currentUserId);
        await updateDoc(myRef, {
            friends: arrayUnion(friendId),
            friendRequest: arrayRemove(friendId) // Friend request se remove karo
        });

        // CHANGED: Ab sentRequests se bhi remove karo agar wo exist karta hai
        if (mySentRequests.includes(friendId)) {
            await updateDoc(myRef, {
                sentRequests: arrayRemove(friendId)
            });
            console.log(`Removed ${friendId} from sentRequests after accepting friend request`);
        }

        // CHANGED: Automatic cleanup bhi call karo
        await cleanupSentRequests(currentUserId, [...myFriends, friendId], mySentRequests);

        // UI refresh karo
        getUsers(currentUserId);

        // CHANGED: Success message
        alert(`You are now friends with ${friendId}!`);

    } catch (error) {
        console.log("Error accepting friend request:", error);
        alert("Error accepting friend request. Please try again.");
    }
}

// Cancel request ke liye function
window.cancelRequest = async (currentUserId, friendId) => {
    try {
        // Friend ke document se request remove karo
        const friendRef = doc(db, 'users', friendId);
        await updateDoc(friendRef, {
            friendRequest: arrayRemove(currentUserId)
        });

        // Apne document se bhi remove karo
        const myRef = doc(db, 'users', currentUserId);
        await updateDoc(myRef, {
            sentRequests: arrayRemove(friendId)
        });

        // CHANGED: Poori list refresh karne ki bajaye sirf button update karo
        updateButtonToAdd(currentUserId, friendId);

    } catch (error) {
        console.log("Error canceling request:", error);
    }
}

// CHANGED: Naya function jo button ko "Cancel Request" mein change karega
function updateButtonToCancel(currentUserId, friendId) {
    const button = document.getElementById(`btn-${friendId}`);
    if (button) {
        button.textContent = "Cancel Request";
        button.className = "px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition";
        button.onclick = function() { cancelRequest(currentUserId, friendId); };
    }
}

// CHANGED: Naya function jo button ko "Add Friend" mein change karega
function updateButtonToAdd(currentUserId, friendId) {
    const button = document.getElementById(`btn-${friendId}`);
    if (button) {
        button.textContent = "Add Friend";
        button.className = "px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition";
        button.onclick = function() { addFriend(currentUserId, friendId); };
    }
}

// Global variable currentUserId ko track karne ke liye
let currentUserId = "";

function checkUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            getUsers(currentUserId);
        } else {
            window.location.href = "./login.html";
        }
    });
};

checkUser();