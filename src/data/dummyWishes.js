// ============================================================
// COSMIC JOURNEY — Data dummy Gallery (Fase 4)
// Hanya dipakai src/services/wishes.js > getWishes(). Fase 6: file ini tidak dipakai lagi
// (boleh dihapus) karena data datang dari Supabase.
// Termasuk 1 entri private + 1 entri pending agar filter di getWishes() teruji.
// ============================================================

const NOW = Date.now()
const ago = (hours) => new Date(NOW - hours * 3600 * 1000).toISOString()

export const DUMMY_WISHES = [
    {
        id: 'd01', displayName: 'Astronaut-7F2', isAnonymous: true, category: 'wish', rating: 5,
        message: 'Wishing for a quiet year and a very long sunrise.',
        createdAt: ago(2), status: 'approved', isPrivate: false,
    },
    {
        id: 'd02', displayName: 'Maya', isAnonymous: false, category: 'feedback', rating: 5,
        message: 'The moment my name turned into a constellation I actually gasped. The music, the pacing, all of it. It felt like someone built a tiny universe just for me.',
        createdAt: ago(5), status: 'approved', isPrivate: false,
    },
    {
        id: 'd03', displayName: 'Astronaut-K9Q', isAnonymous: true, category: 'suggestion', rating: 4,
        message: 'Would love a way to save my constellation as an image to share. Also the planet facts could use a tiny "read more" link!',
        createdAt: ago(9), status: 'approved', isPrivate: false,
    },
    {
        id: 'd04', displayName: 'Rizky', isAnonymous: false, category: 'feedback', rating: 5,
        message: 'Mantap! Animasi roketnya halus banget di HP saya. Terima kasih sudah bikin ini 🚀',
        createdAt: ago(14), status: 'approved', isPrivate: false,
    },
    {
        id: 'd05', displayName: 'Lina Park', isAnonymous: false, category: 'suggestion', rating: 4,
        message: 'Could the Solar System have a scale toggle? Seeing the real distances between planets would be so humbling.',
        createdAt: ago(20), status: 'approved', isPrivate: false,
    },
    {
        id: 'd06', displayName: 'Astronaut-B3M', isAnonymous: true, category: 'wish', rating: 5,
        message: 'I wish for my grandmother to see another spring.',
        createdAt: ago(27), status: 'approved', isPrivate: false,
    },
    {
        id: 'd07', displayName: 'Theo', isAnonymous: false, category: 'feedback', rating: 3,
        message: 'Beautiful, but the intro loaded slowly on my old phone. Once it started it was great though.',
        createdAt: ago(40), status: 'approved', isPrivate: false,
    },
    {
        id: 'd08', displayName: 'Sari', isAnonymous: false, category: 'developer', rating: 5,
        message: 'Whoever built this: you have a gift for making people feel small in the best way. Please keep making things like this.',
        createdAt: ago(53), status: 'approved', isPrivate: false,
    },
    {
        id: 'd09', displayName: 'Astronaut-X4D', isAnonymous: true, category: 'feedback', rating: 4,
        message: 'Loved the deep space part. The hold-to-travel button was a neat idea.',
        createdAt: ago(70), status: 'approved', isPrivate: false,
    },
    {
        id: 'd10', displayName: 'Omar', isAnonymous: false, category: 'wish', rating: 5,
        message: 'For everyone who looked up tonight and felt a little less alone.',
        createdAt: ago(95), status: 'approved', isPrivate: false,
    },
    {
        id: 'd11', displayName: 'Dewi', isAnonymous: false, category: 'suggestion', rating: 5,
        message: 'Tambahkan bahasa Indonesia ya, biar adik-adik saya bisa ikut baca. Konsepnya keren sekali!',
        createdAt: ago(120), status: 'approved', isPrivate: false,
    },
    {
        id: 'd12', displayName: 'Astronaut-9HN', isAnonymous: true, category: 'wish', rating: 4,
        message: 'Wish: pass my exams. Also a cat.',
        createdAt: ago(150), status: 'approved', isPrivate: false,
    },
    {
        id: 'd13', displayName: 'Jonas', isAnonymous: false, category: 'feedback', rating: 5,
        message: 'Found the brightest falling star on my third try. Why did that feel like winning a prize?',
        createdAt: ago(200), status: 'approved', isPrivate: false,
    },
    {
        id: 'd14', displayName: 'Astronaut-Q2W', isAnonymous: true, category: 'developer', rating: 5,
        message: 'Is this built with react-three-fiber? The planets look so good. I would happily read a write-up on how you made it.',
        createdAt: ago(260), status: 'approved', isPrivate: false,
    },
    {
        id: 'd15', displayName: 'Nadia', isAnonymous: false, category: 'wish', rating: 5,
        message: 'I am writing this from a hospital waiting room, and for five minutes I forgot where I was. Thank you for that. I am wishing for good news tomorrow, for me and for everyone sitting in these chairs.',
        createdAt: ago(330), status: 'approved', isPrivate: false,
    },
    {
        id: 'd16', displayName: 'Kenji', isAnonymous: false, category: 'suggestion', rating: 4,
        message: 'A tiny shooting-star sound when the page changes would be lovely.',
        createdAt: ago(420), status: 'approved', isPrivate: false,
    },
    {
        id: 'd17', displayName: 'Astronaut-L6T', isAnonymous: true, category: 'feedback', rating: 2,
        message: 'The music did not start until I tapped a few times, and the volume was too low on my phone. The rest is lovely.',
        createdAt: ago(500), status: 'approved', isPrivate: false,
    },
    {
        id: 'd18', displayName: 'Bima', isAnonymous: false, category: 'feedback', rating: 5,
        message: 'Keren banget transisinya, kayak beneran terbang melewati tata surya.',
        createdAt: ago(600), status: 'approved', isPrivate: false,
    },
    {
        id: 'd19', displayName: 'Clara', isAnonymous: false, category: 'wish', rating: 4,
        message: 'May all my plants survive the summer.',
        createdAt: ago(750), status: 'approved', isPrivate: false,
    },
    {
        id: 'd20', displayName: 'Astronaut-V8R', isAnonymous: true, category: 'suggestion', rating: 5,
        message: 'Please add a section about black holes with that same gentle narration. I would stay there for hours.',
        createdAt: ago(900), status: 'approved', isPrivate: false,
    },
    {
        id: 'd21', displayName: 'Hana', isAnonymous: false, category: 'developer', rating: 5,
        message: 'Thank you for making something purely beautiful. No ads, no signup, just stars. It reminded me why I fell in love with the internet.',
        createdAt: ago(1100), status: 'approved', isPrivate: false,
    },
    {
        id: 'd22', displayName: 'Farid', isAnonymous: false, category: 'feedback', rating: 4,
        message: 'Smooth on desktop. The Phenomena section is my favourite.',
        createdAt: ago(1400), status: 'approved', isPrivate: false,
    },
    {
        id: 'd23', displayName: 'Astronaut-C5J', isAnonymous: true, category: 'wish', rating: 5,
        message: 'I wish my dad would call more. I wish I would call him more, too.',
        createdAt: ago(1800), status: 'approved', isPrivate: false,
    },
    {
        id: 'd24', displayName: 'Elena', isAnonymous: false, category: 'suggestion', rating: 3,
        message: 'Some text is a bit small and dim on my phone in daylight. A slightly brighter colour would help.',
        createdAt: ago(2200), status: 'approved', isPrivate: false,
    },
    {
        id: 'd25', displayName: 'Putra', isAnonymous: false, category: 'wish', rating: 5,
        message: 'Semoga semua orang yang baca ini hari-harinya dimudahkan. Amin.',
        createdAt: ago(2600), status: 'approved', isPrivate: false,
    },
    {
        id: 'd26', displayName: 'Astronaut-M7S', isAnonymous: true, category: 'feedback', rating: 4,
        message: 'Showed this to my kids and they asked to go around twice.',
        createdAt: ago(3000), status: 'approved', isPrivate: false,
    },
    {
        id: 'd27', displayName: 'Iris', isAnonymous: false, category: 'wish', rating: 5,
        message: 'Wishing for courage. The kind that does not feel like courage until it is over.',
        createdAt: ago(3400), status: 'approved', isPrivate: false,
    },
    {
        id: 'd28', displayName: 'Daniel', isAnonymous: false, category: 'feedback', rating: 4,
        message: 'Great experience overall. The ending message gave me chills.',
        createdAt: ago(3800), status: 'approved', isPrivate: false,
    },
    {
        id: 'd29', displayName: 'Astronaut-F3Z', isAnonymous: true, category: 'developer', rating: 5,
        message: 'Any chance of open-sourcing the falling star mini-game? I would love to learn from it.',
        createdAt: ago(4200), status: 'approved', isPrivate: false,
    },
    {
        id: 'd30', displayName: 'Ayu', isAnonymous: false, category: 'wish', rating: 5,
        message: 'Semoga kita semua bisa pulang dengan selamat, ke tempat yang kita sebut rumah.',
        createdAt: ago(4600), status: 'approved', isPrivate: false,
    },

    // Tidak boleh pernah muncul di Gallery (diuji oleh getWishes):
    {
        id: 'd31', displayName: 'Astronaut-P1X', isAnonymous: true, category: 'developer', rating: 1,
        message: 'Private note to the developer: this should never be shown.',
        createdAt: ago(10), status: 'approved', isPrivate: true,
    },
    {
        id: 'd32', displayName: 'Waiting-Room', isAnonymous: false, category: 'feedback', rating: 5,
        message: 'Still pending review, so not public yet.',
        createdAt: ago(1), status: 'pending', isPrivate: false,
    },
]