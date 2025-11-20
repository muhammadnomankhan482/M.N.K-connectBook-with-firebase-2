import { updateDoc, arrayRemove, arrayUnion, auth, collection, db, doc, getDoc, getDocs, onAuthStateChanged, query, where, signOut } from "./config.js";


function checkUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            getFriendRequests(uid);
            // ...
        } else {
            // User is signed out
            window.location.href = "./login.html";
            // ...
        }
    });
};

let usersContainer = document.getElementById("friendsList")
async function getFriendRequests(currentUserId) {

    usersContainer.innerHTML = "";
    const docRef = doc(db, "users", currentUserId);
    const docSnap = await getDoc(docRef);
    let currentUserData = null

    if (docSnap.exists()) {
        currentUserData = docSnap.data()
    } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
        usersContainer.innerHTML = `<p class="text-center text-gray-500">No user data found</p>`;
        return;
    }

    const { friendRequest } = currentUserData

    if (!friendRequest || friendRequest.length === 0) {
        usersContainer.innerHTML = `<p class="text-center text-gray-500">No friend requests</p>`;
        return;
    }
    console.log(friendRequest)
    const usersRef = collection(db, "users");
    const q = query(usersRef, where('userId', 'in', friendRequest));

    const querySnapshot = await getDocs(q);

    // CHANGED: Check if any documents found
    if (querySnapshot.empty) {
        usersContainer.innerHTML = `<p class="text-center text-gray-500">No users found for these friend requests</p>`;
        return;
    }

    querySnapshot.forEach((doc) => {
        const user = doc.data();
        const { firstName, lastName, email, userId } = user || {}
        usersContainer.innerHTML += `
    <div
                        class="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition">
                        <div class="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/100?img=11" alt=alt="${firstName} ${lastName}"
                                class="h-14 w-14 rounded-full object-cover">
                            <div>
                                <h3 class="text-lg font-semibold">${firstName} ${lastName}</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400">${email}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onClick ="addFriend('${currentUserId}','${userId}')"
                                class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
                                Accept
                            </button>
                            <button onClick ="deleteFriend('${currentUserId}','${userId}')"
                                class="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-600 text-gray-800 dark:text-gray-100 text-sm font-medium rounded-lg transition">
                                Decline
                            </button>
                        </div>
                    </div>`
    });
}


window.addFriend = async (currentUserId, friendId) => {
    try {
        const friendRef = doc(db, "users", friendId);

        // Atomically add a new friend to the "friends" array field.
        await updateDoc(friendRef, {
            friends: arrayUnion(currentUserId)
        });

        const myRef = doc(db, "users", currentUserId);
        // Atomically remove a friend from the "friendRequests" array field and add friend into friends array.
        await updateDoc(myRef, {
            friendRequest: arrayRemove(friendId),
            friends: arrayUnion(friendId)
        });

        // Refresh the friend requests list
        getFriendRequests(currentUserId);

    } catch (error) {
        console.log("error aa gaya friendRequest me ", error)
    }
}

window.deleteFriend = async (currentUserId, friendId) => {
    try {
        const myRef = doc(db, "users", currentUserId);

        // Remove friend from friendRequest array
        await updateDoc(myRef, {
            friendRequest: arrayRemove(friendId)
        });

        // Refresh the friend requests list
        getFriendRequests(currentUserId);

    } catch (error) {
        console.log("Error in deleteFriend: ", error)
    }
}

window.logout = () => {
    signOut(auth).then(() => {
        window.location.href = "./login.html"
        // Sign-out successful.
    }).catch((error) => {
        // An error happened.
    });
}
checkUser();