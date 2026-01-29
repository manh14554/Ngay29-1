let allPosts = [];
let allComments = [];
let filteredPosts = [];
let currentSort = null;

// Helper: fetch db.json and parse posts/comments
async function loadData() {
    try {
        const response = await fetch('db.json');
        let db = await response.json();
        // Nếu db là mảng (trường hợp file db.json hiện tại)
        if (Array.isArray(db)) db = db[0];
        allPosts = db.posts || [];
        allComments = db.comments || [];
        filteredPosts = [...allPosts];
        renderPosts(filteredPosts);
    } catch (error) {
        document.getElementById('products-container').innerHTML =
            '<tr><td colspan="7" class="text-center text-danger">Failed to load posts. Please check that db.json exists.</td></tr>';
    }
}

// Helper: get max id (as number) from array, return string id
function getNextId(arr) {
    let maxId = arr.reduce((max, item) => {
        let idNum = parseInt(item.id, 10);
        return (!isNaN(idNum) && idNum > max) ? idNum : max;
    }, 0);
    return String(maxId + 1);
}

// Render posts with soft-delete and comments
function renderPosts(posts) {
    const container = document.getElementById('products-container');
    if (!posts || posts.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Không tìm thấy post nào.</td></tr>';
        return;
    }
    container.innerHTML = posts.map((post, idx) => {
        const isDeleted = post.isDeleted;
        const postTitle = isDeleted ? `<s>${post.title}</s>` : post.title;
        const postViews = isDeleted ? `<s>${post.views}</s>` : post.views;
        const commentList = allComments
            .filter(c => c.postId === post.id)
            .map(c => `
                <li>
                    <span${c.isDeleted ? ' style="text-decoration:line-through;color:#888;"' : ''}>${c.text}</span>
                    <button class="btn btn-sm btn-danger ms-2" onclick="deleteComment('${c.id}')">Xoá</button>
                    <button class="btn btn-sm btn-secondary ms-1" onclick="editCommentPrompt('${c.id}')">Sửa</button>
                </li>
            `).join('');
        return `
        <tr${isDeleted ? ' class="table-secondary"' : ''}>
            <td>${post.id}</td>
            <td></td>
            <td>${postTitle}</td>
            <td></td>
            <td></td>
            <td>
                <div>Lượt xem: ${postViews}</div>
                <div>
                    <button class="btn btn-sm btn-warning" onclick="softDeletePost('${post.id}')">${isDeleted ? 'Khôi phục' : 'Xoà mềm'}</button>
                    <button class="btn btn-sm btn-danger" onclick="hardDeletePost('${post.id}')">Xoá cứng</button>
                    <button class="btn btn-sm btn-primary" onclick="editPostPrompt('${post.id}')">Sửa</button>
                </div>
                <div class="mt-2">
                    <b>Bình luận:</b>
                    <ul>${commentList || '<li><i>Không có bình luận</i></li>'}</ul>
                    <input type="text" id="comment-input-${post.id}" class="form-control form-control-sm d-inline-block" style="width:70%;" placeholder="Thêm bình luận...">
                    <button class="btn btn-sm btn-success" onclick="addComment('${post.id}')">Thêm</button>
                </div>
            </td>
            <td></td>
        </tr>
        `;
    }).join('');
}

// Search/filter posts by title
function onChanged() {
    const searchValue = document.getElementById('searchInput').value.trim().toLowerCase();
    filteredPosts = allPosts.filter(p =>
        p.title.toLowerCase().includes(searchValue)
    );
    applySort();
    renderPosts(filteredPosts);
}

// Sort posts
function sortBy(type) {
    currentSort = type;
    applySort();
    renderPosts(filteredPosts);
}
function applySort() {
    if (!currentSort) return;
    if (currentSort === 'nameAsc') {
        filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === 'nameDesc') {
        filteredPosts.sort((a, b) => b.title.localeCompare(a.title));
    } else if (currentSort === 'priceDesc') {
        filteredPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
}

// Soft delete/restore post
function softDeletePost(id) {
    const post = allPosts.find(p => p.id === id);
    if (post) {
        post.isDeleted = !post.isDeleted;
        saveDb();
        renderPosts(filteredPosts);
    }
}

// Hard delete post (remove from array)
function hardDeletePost(id) {
    if (!confirm('Xoá cứng post này?')) return;
    allPosts = allPosts.filter(p => p.id !== id);
    filteredPosts = filteredPosts.filter(p => p.id !== id);
    // Xoá luôn comments liên quan
    allComments = allComments.filter(c => c.postId !== id);
    saveDb();
    renderPosts(filteredPosts);
}

// Add new post
function addPostPrompt() {
    const title = prompt('Nhập tiêu đề post:');
    if (!title) return;
    const views = parseInt(prompt('Nhập số lượt xem:', '0'), 10) || 0;
    const newId = getNextId(allPosts);
    const newPost = { id: newId, title, views };
    allPosts.push(newPost);
    filteredPosts = [...allPosts];
    saveDb();
    renderPosts(filteredPosts);
}

// Edit post
function editPostPrompt(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    const title = prompt('Sửa tiêu đề:', post.title);
    if (title === null) return;
    const views = parseInt(prompt('Sửa lượt xem:', post.views), 10) || 0;
    post.title = title;
    post.views = views;
    saveDb();
    renderPosts(filteredPosts);
}

// CRUD for comments
function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    const newId = getNextId(allComments);
    allComments.push({ id: newId, text, postId });
    input.value = '';
    saveDb();
    renderPosts(filteredPosts);
}
function deleteComment(id) {
    const cmt = allComments.find(c => c.id === id);
    if (cmt) {
        cmt.isDeleted = !cmt.isDeleted;
        saveDb();
        renderPosts(filteredPosts);
    }
}
function editCommentPrompt(id) {
    const cmt = allComments.find(c => c.id === id);
    if (!cmt) return;
    const text = prompt('Sửa bình luận:', cmt.text);
    if (text === null) return;
    cmt.text = text;
    saveDb();
    renderPosts(filteredPosts);
}

// Save to db.json (simulate, for demo: update localStorage)
function saveDb() {
    // For demo only: save to localStorage (since fetch can't write db.json)
    const db = {
        posts: allPosts,
        comments: allComments,
        profile: { name: "typicode" }
    };
    localStorage.setItem('db', JSON.stringify(db));
}

// Load from localStorage if exists (simulate)
function loadFromLocalStorage() {
    const dbStr = localStorage.getItem('db');
    if (dbStr) {
        try {
            const db = JSON.parse(dbStr);
            allPosts = db.posts || [];
            allComments = db.comments || [];
            filteredPosts = [...allPosts];
        } catch {}
    }
}

// On page load
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    loadData();
    // Add button for add post
    const btn = document.createElement('button');
    btn.className = 'btn btn-success mb-3';
    btn.innerText = 'Thêm Post';
    btn.onclick = addPostPrompt;
    document.querySelector('.container').insertBefore(btn, document.querySelector('.table-responsive'));
});

// Expose functions
window.onChanged = onChanged;
window.sortBy = sortBy;
window.softDeletePost = softDeletePost;
window.hardDeletePost = hardDeletePost;
window.addPostPrompt = addPostPrompt;
window.editPostPrompt = editPostPrompt;
window.addComment = addComment;
window.deleteComment = deleteComment;
window.editCommentPrompt = editCommentPrompt;
