package com.minifacebook.module.auth.presentation;

import com.minifacebook.module.auth.domain.model.Role;
import com.minifacebook.module.auth.infrastructure.persistence.document.UserDocument;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import com.minifacebook.module.friendship.domain.entity.FriendshipStatus;
import com.minifacebook.module.friendship.infrastructure.persistence.document.FriendshipDocument;
import com.minifacebook.module.friendship.infrastructure.persistence.repository.MongoFriendshipRepository;
import com.minifacebook.module.post.domain.entity.ReactionType;
import com.minifacebook.module.post.infrastructure.persistence.document.CommentDocument;
import com.minifacebook.module.post.infrastructure.persistence.document.PostDocument;
import com.minifacebook.module.post.infrastructure.persistence.document.ReactionDocument;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoCommentRepository;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoPostRepository;
import com.minifacebook.module.post.infrastructure.persistence.repository.MongoReactionRepository;
import com.minifacebook.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/dev")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dev Seed", description = "API tiện ích hỗ trợ sinh dữ liệu mẫu giả lập người dùng Việt Nam tương tác thật")
public class DevSeedController {

    private final MongoUserRepository userRepository;
    private final MongoFriendshipRepository friendshipRepository;
    private final MongoPostRepository postRepository;
    private final MongoCommentRepository commentRepository;
    private final MongoReactionRepository reactionRepository;
    private final PasswordEncoder passwordEncoder;

    private static class SeedUser {
        String email;
        String name;
        String avatar;
        String bio;
        String city;
        String hometown;
        String work;
        String relationship;

        SeedUser(String email, String name, String avatar, String bio, String city, String hometown, String work, String relationship) {
            this.email = email;
            this.name = name;
            this.avatar = avatar;
            this.bio = bio;
            this.city = city;
            this.hometown = hometown;
            this.work = work;
            this.relationship = relationship;
        }
    }

    private static class SeedPost {
        String authorEmail;
        String content;
        String imageUrl;

        SeedPost(String authorEmail, String content, String imageUrl) {
            this.authorEmail = authorEmail;
            this.content = content;
            this.imageUrl = imageUrl;
        }
    }

    /**
     * Test Sentry BE (Sprint 6.5). Ném RuntimeException → GlobalExceptionHandler → Sentry.
     * Chỉ dùng local khi đã set SENTRY_DSN. Xóa hoặc chặn production sau này.
     */
    @GetMapping("/sentry-test")
    @Operation(summary = "Test Sentry BE", description = "Cố ý ném 500 để kiểm tra Sentry Issues")
    public void sentryTest() {
        throw new RuntimeException("Sentry BE test " + Instant.now());
    }

    @GetMapping("/seed")
    @Operation(summary = "Sinh dữ liệu 20 người dùng Việt Nam kèm tương tác thật", description = "Tạo 20 tài khoản, kết bạn ngẫu nhiên, đăng bài viết kèm hình ảnh, thả tim/haha và bình luận.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> seedData() {
        log.info("[DevSeed] Bắt đầu sinh dữ liệu mẫu...");
        Map<String, Object> stats = new HashMap<>();

        // 1. Khởi tạo danh sách 20 User
        List<SeedUser> seedUsers = new ArrayList<>();
        seedUsers.add(new SeedUser("nguyen.van.an@seed.miniface.com", "Nguyễn Văn An", 
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80", 
            "Sống tích cực, yêu lập trình và công nghệ.", "Hà Nội", "Nam Định", "Software Engineer tại FPT", "Độc thân"));
        seedUsers.add(new SeedUser("tran.thi.vy@seed.miniface.com", "Trần Thị Vy", 
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80", 
            "Đam mê thiết kế UI/UX và cắm hoa.", "TP. Hồ Chí Minh", "Đồng Nai", "Product Designer tại Hizo", "Hẹn hò"));
        seedUsers.add(new SeedUser("le.minh.hoang@seed.miniface.com", "Lê Minh Hoàng", 
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80", 
            "Thích du lịch bụi và chụp ảnh phong cảnh.", "Đà Nẵng", "Quảng Nam", "Photographer tự do", "Độc thân"));
        seedUsers.add(new SeedUser("pham.thanh.khanh@seed.miniface.com", "Phạm Thanh Khánh", 
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80", 
            "Just a guy who loves building clean code.", "Hà Nội", "Hải Phòng", "Tech Lead tại VNG", "Đã kết hôn"));
        seedUsers.add(new SeedUser("vu.hong.hanh@seed.miniface.com", "Vũ Hồng Hạnh", 
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80", 
            "Yêu mèo, thích đọc sách và thưởng trà.", "TP. Hồ Chí Minh", "Lâm Đồng", "Content Writer tại Shopee", "Độc thân"));
        seedUsers.add(new SeedUser("hoang.minh.quan@seed.miniface.com", "Hoàng Minh Quân", 
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80", 
            "Chạy bộ mỗi sáng. Khởi nghiệp là hành trình dài.", "Hà Nội", "Thanh Hóa", "Founder tại Startup X", "Phức tạp"));
        seedUsers.add(new SeedUser("phan.thao.nguyen@seed.miniface.com", "Phan Thảo Nguyên", 
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80", 
            "Nấu ăn là nghệ thuật, người nấu là nghệ sĩ.", "TP. Hồ Chí Minh", "Bến Tre", "Pastry Chef tại Bakery", "Hẹn hò"));
        seedUsers.add(new SeedUser("do.anh.tuan@seed.miniface.com", "Đỗ Anh Tuấn", 
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80", 
            "Thích chơi guitar và hát nghêu ngao.", "Hà Nội", "Bắc Ninh", "Giảng viên Thanh nhạc", "Độc thân"));
        seedUsers.add(new SeedUser("ngo.minh.duc@seed.miniface.com", "Ngô Minh Đức", 
            "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80", 
            "Đam mê nghiên cứu AI và Data Science.", "TP. Hồ Chí Minh", "Khánh Hòa", "Data Scientist tại VinAI", "Độc thân"));
        seedUsers.add(new SeedUser("bui.thi.mai@seed.miniface.com", "Bùi Thị Mai", 
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80", 
            "Yoga mỗi ngày giữ cho tâm hồn an yên.", "Đà Nẵng", "Huế", "Yoga Instructor", "Đã kết hôn"));
        seedUsers.add(new SeedUser("duong.quoc.bao@seed.miniface.com", "Dương Quốc Bảo", 
            "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80", 
            "Thích chơi game, đá bóng và làm bạn với động vật.", "Hà Nội", "Hà Tĩnh", "Game Developer", "Độc thân"));
        seedUsers.add(new SeedUser("ly.thien.huong@seed.miniface.com", "Lý Thiên Hương", 
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80", 
            "Du lịch là để tìm lại chính mình.", "TP. Hồ Chí Minh", "An Giang", "Travel Vlogger", "Hẹn hò"));
        seedUsers.add(new SeedUser("nam.dang@seed.miniface.com", "Đặng Văn Nam", 
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80", 
            "Luôn tìm kiếm giải pháp tối ưu cho mọi vấn đề.", "Cần Thơ", "Vĩnh Long", "System Architect tại Viettel", "Độc thân"));
        seedUsers.add(new SeedUser("dung.lam@seed.miniface.com", "Lâm Mỹ Dung", 
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80", 
            "Yêu hội họa, vẽ nên những sắc màu cuộc sống.", "TP. Hồ Chí Minh", "Tây Ninh", "Illustrator Artist", "Độc thân"));
        seedUsers.add(new SeedUser("giabao.trinh@seed.miniface.com", "Trịnh Gia Bảo", 
            "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=200&auto=format&fit=crop&q=80", 
            "Đầu tư tài chính và phát triển bản thân.", "Hà Nội", "Hưng Yên", "Financial Analyst", "Độc thân"));
        seedUsers.add(new SeedUser("kiet.nguyen@seed.miniface.com", "Nguyễn Tuấn Kiệt", 
            "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80", 
            "Đam mê thiết kế thời trang và nhiếp ảnh.", "TP. Hồ Chí Minh", "Long An", "Fashion Designer", "Hẹn hò"));
        seedUsers.add(new SeedUser("thao.tran@seed.miniface.com", "Trần Phương Thảo", 
            "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200&auto=format&fit=crop&q=80", 
            "Học hỏi không ngừng, hướng tới tương lai.", "Hà Nội", "Phú Thọ", "Giáo viên Tiếng Anh", "Đã kết hôn"));
        seedUsers.add(new SeedUser("triet.pham@seed.miniface.com", "Phạm Minh Triết", 
            "https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=200&auto=format&fit=crop&q=80", 
            "Yêu thích thể thao, đặc biệt là bóng rổ và bơi lội.", "Đà Nẵng", "Quảng Trị", "Fitness Trainer", "Độc thân"));
        seedUsers.add(new SeedUser("yen.vo@seed.miniface.com", "Võ Hoàng Yến", 
            "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80", 
            "Luôn mỉm cười, mọi điều tốt đẹp sẽ đến.", "TP. Hồ Chí Minh", "Cà Mau", "Marketing Specialist tại Tiki", "Độc thân"));
        seedUsers.add(new SeedUser("khang.nguyen@seed.miniface.com", "Nguyễn Minh Khang", 
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80", 
            "Sống là trải nghiệm và cống hiến hết mình.", "Hà Nội", "Nghệ An", "HR Manager tại VCCorp", "Đã kết hôn"));

        String defaultEncodedPassword = passwordEncoder.encode("123456");
        List<UserDocument> createdUsers = new ArrayList<>();
        int usersCreated = 0;

        for (SeedUser su : seedUsers) {
            Optional<UserDocument> opt = userRepository.findByEmail(su.email);
            if (opt.isEmpty()) {
                UserDocument ud = new UserDocument();
                ud.setEmail(su.email);
                ud.setName(su.name);
                ud.setPassword(defaultEncodedPassword);
                ud.setAvatar(su.avatar);
                ud.setBio(su.bio);
                ud.setCity(su.city);
                ud.setHometown(su.hometown);
                ud.setWork(su.work);
                ud.setRelationship(su.relationship);
                ud.setRoles(Collections.singleton(Role.USER));
                ud.setVerified(true);
                UserDocument saved = userRepository.save(ud);
                createdUsers.add(saved);
                usersCreated++;
            } else {
                createdUsers.add(opt.get());
            }
        }
        stats.put("users_created", usersCreated);
        stats.put("total_seed_users", createdUsers.size());

        // 2. Kết bạn chéo
        int friendshipsCreated = 0;
        for (int i = 0; i < createdUsers.size(); i++) {
            UserDocument u1 = createdUsers.get(i);
            // Mỗi người kết bạn với 4 người kế tiếp theo thuật toán vòng tròn
            int[] offsets = {1, 3, 5, 7};
            for (int offset : offsets) {
                int nextIdx = (i + offset) % createdUsers.size();
                UserDocument u2 = createdUsers.get(nextIdx);

                if (u1.getId().equals(u2.getId())) continue;

                boolean exists = friendshipRepository.findByRequesterIdAndAddresseeId(u1.getId(), u2.getId()).isPresent()
                        || friendshipRepository.findByRequesterIdAndAddresseeId(u2.getId(), u1.getId()).isPresent();

                if (!exists) {
                    FriendshipDocument fd = FriendshipDocument.builder()
                            .requesterId(u1.getId())
                            .addresseeId(u2.getId())
                            .status(FriendshipStatus.ACCEPTED)
                            .createdAt(Instant.now().minusSeconds(friendshipsCreated * 1800L))
                            .build();
                    friendshipRepository.save(fd);
                    friendshipsCreated++;
                }
            }
        }

        // 2.5. Kết bạn với user Đỗ Việt Hoàng (viethoang281202@gmail.com) nếu tồn tại
        Optional<UserDocument> hoangOpt = userRepository.findByEmail("viethoang281202@gmail.com");
        if (hoangOpt.isPresent()) {
            UserDocument hoang = hoangOpt.get();
            // Kết bạn với 5 user seed đầu tiên để tạo mạng lưới bạn chung
            for (int k = 0; k < Math.min(5, createdUsers.size()); k++) {
                UserDocument seedUser = createdUsers.get(k);
                if (hoang.getId().equals(seedUser.getId())) continue;

                boolean exists = friendshipRepository.findByRequesterIdAndAddresseeId(hoang.getId(), seedUser.getId()).isPresent()
                        || friendshipRepository.findByRequesterIdAndAddresseeId(seedUser.getId(), hoang.getId()).isPresent();

                if (!exists) {
                    FriendshipDocument fd = FriendshipDocument.builder()
                            .requesterId(hoang.getId())
                            .addresseeId(seedUser.getId())
                            .status(FriendshipStatus.ACCEPTED)
                            .createdAt(Instant.now())
                            .build();
                    friendshipRepository.save(fd);
                    friendshipsCreated++;
                }
            }
        }

        stats.put("friendships_created", friendshipsCreated);

        // 3. Khởi tạo danh sách bài viết
        List<SeedPost> seedPosts = new ArrayList<>();
        seedPosts.add(new SeedPost("nguyen.van.an@seed.miniface.com", 
            "Chào cả nhà! Hôm nay trời Hà Nội mát mẻ quá, thích hợp làm một ly cà phê trứng nóng hổi ở phố cổ. Chúc mọi người ngày mới tràn đầy năng lượng!", 
            "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("tran.thi.vy@seed.miniface.com", 
            "Vừa hoàn thành xong bản mockup thiết kế mới cho dự án Mini Face. Mọi người thấy phối tông màu tím và xám này đã sang trọng và hiện đại chưa ạ? Xin ý kiến góp ý của cả nhà nha.", 
            "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("le.minh.hoang@seed.miniface.com", 
            "Chuyến đi săn mây ở đỉnh Hòn Bồ Đà Lạt cuối tuần qua thật tuyệt vời. Không khí se lạnh và sương mù dày đặc làm tan biến mọi mệt mỏi công việc thường ngày. Thiên nhiên nước mình quá đẹp!", 
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("vu.hong.hanh@seed.miniface.com", 
            "Bé mèo Anh lông ngắn nhà mình hôm nay lười biếng cực kỳ, cứ nằm sưởi nắng bên bậu cửa sổ suốt từ sáng đến giờ mà không thèm ngó ngàng đến sen luôn. Nhìn ghét ghê!", 
            "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("ngo.minh.duc@seed.miniface.com", 
            "Đang ngâm cứu mấy mô hình Generative AI và LLM mới để ứng dụng cho hệ thống gợi ý. Lĩnh vực công nghệ này thay đổi nhanh khủng khiếp, ngơi nghỉ một tuần là thấy tụt hậu ngay.", 
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("bui.thi.mai@seed.miniface.com", 
            "Một buổi sáng bình yên tuyệt đối với bài tập Yoga Vinyasa chào mặt trời. Hãy dành ra ít nhất 30 phút mỗi ngày để lắng nghe tiếng nói bên trong cơ thể mình nhé cả nhà yêu.", 
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("ly.thien.huong@seed.miniface.com", 
            "Khám phá ẩm thực đường phố và chợ nổi Cái Răng tại Cần Thơ. Thưởng thức tô hủ tiếu nóng ngay trên ghe lúc bình minh lên là trải nghiệm không thể quên. Người miền Tây quá đỗi dễ thương!", 
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("dung.lam@seed.miniface.com", 
            "Bức tranh màu nước phong cảnh chiều hoàng hôn trên sông Sài Gòn mình vừa hoàn thiện xong sau 3 ngày miệt mài. Hy vọng nét vẽ mộc mạc này mang lại chút bình yên cho mọi người.", 
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("kiet.nguyen@seed.miniface.com", 
            "Phối đồ phong cách Streetwear tối giản (Minimalist Style) cho ngày nắng Sài Gòn. Chỉ cần áo thun trơn, quần túi hộp và một đôi sneaker trắng là đủ tự tin xuống phố rồi.", 
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("hoang.minh.quan@seed.miniface.com", 
            "Buổi họp đầu tuần đầy năng lượng và quyết tâm cùng toàn thể anh em startup. Nhiều mục tiêu lớn trong quý này cần phải vượt qua. Chiến hết mình nào!", 
            "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80"));
        seedPosts.add(new SeedPost("thao.tran@seed.miniface.com", 
            "Mùa thi đến rồi, chúc các em học sinh lớp 12 đạt kết quả cao nhất trong kỳ thi tốt nghiệp THPT Quốc gia sắp tới nhé. Bình tĩnh, tự tin và chiến thắng!", null));
        seedPosts.add(new SeedPost("yen.vo@seed.miniface.com", 
            "Một ngày cuối tuần thư giãn đúng nghĩa, tự thưởng cho mình một cốc trà sữa và dạo quanh phố đi bộ Nguyễn Huệ cùng cô bạn thân.", null));
        seedPosts.add(new SeedPost("giabao.trinh@seed.miniface.com", 
            "Thị trường tài chính tuần này biến động khá mạnh. Cơ hội luôn đi kèm với rủi ro, quan trọng là giữ vững cái đầu lạnh và kỷ luật quản trị vốn.", null));
        seedPosts.add(new SeedPost("do.anh.tuan@seed.miniface.com", 
            "Ngồi ngân nga vài câu hát cũ bên cây đàn guitar quen thuộc. Âm nhạc luôn là liều thuốc tốt nhất xoa dịu tâm hồn sau những ngày làm việc căng thẳng.", null));
        seedPosts.add(new SeedPost("triet.pham@seed.miniface.com", 
            "Khởi động tuần mới bằng 5 hiệp bóng rổ đẫm mồ hôi. Thể thao giúp duy trì sự bền bỉ và nâng cao sức đề kháng tuyệt vời.", null));

        int postsCreated = 0;
        int commentsCreated = 0;
        int reactionsCreated = 0;
        Random random = new Random();

        List<String> commentTemplates = Arrays.asList(
            "Ảnh đẹp và chất quá bạn ơi!",
            "Tuyệt vời quá chúc mừng nha!",
            "Xịn xò quá, ngóng chờ chia sẻ thêm.",
            "Chào buổi sáng vui vẻ nhé!",
            "Rất ý nghĩa luôn bạn ạ.",
            "Tông màu này đẹp lắm Vy ơi.",
            "Thèm cafe trứng quá An ơi.",
            "Đà Lạt lúc nào cũng mộng mơ hết.",
            "Bé mèo cưng quá trời luôn.",
            "Chia sẻ kinh nghiệm làm AI đi Đức ơi.",
            "Món này ngon xuất sắc!",
            "Tự hào phong cảnh Việt Nam mình ghê.",
            "Chúc tuần mới tràn đầy may mắn nhé!"
        );

        for (SeedPost sp : seedPosts) {
            Optional<UserDocument> authorOpt = userRepository.findByEmail(sp.authorEmail);
            if (authorOpt.isPresent()) {
                UserDocument author = authorOpt.get();

                // Kiểm tra xem bài viết đã được seed chưa để tránh lặp
                boolean postExists = postRepository.findAll().stream()
                        .anyMatch(p -> p.getAuthorId().equals(author.getId()) && p.getContent().equals(sp.content));

                if (!postExists) {
                    PostDocument pd = new PostDocument();
                    pd.setAuthorId(author.getId());
                    pd.setContent(sp.content);
                    if (sp.imageUrl != null) {
                        pd.setImageUrls(Collections.singletonList(sp.imageUrl));
                    } else {
                        pd.setImageUrls(new ArrayList<>());
                    }
                    pd.setDeleted(false);
                    pd.setCreatedAt(Instant.now().minusSeconds(postsCreated * 3600L + 1800));
                    pd.setUpdatedAt(Instant.now().minusSeconds(postsCreated * 3600L + 1800));

                    // Lưu bài viết để sinh ID
                    PostDocument savedPost = postRepository.save(pd);
                    postsCreated++;

                    // 4. Sinh ngẫu nhiên từ 3-6 Reaction
                    int reactionNum = 3 + random.nextInt(4); // 3, 4, 5, 6
                    Map<ReactionType, Integer> rxCount = new HashMap<>();
                    Set<String> reactedUserIds = new HashSet<>();

                    for (int r = 0; r < reactionNum; r++) {
                        UserDocument reactor = createdUsers.get(random.nextInt(createdUsers.size()));
                        // Tránh cùng 1 người react nhiều lần trên 1 post
                        if (reactedUserIds.contains(reactor.getId())) continue;

                        ReactionType type = ReactionType.values()[random.nextInt(3)]; // LIKE, LOVE, HAHA
                        ReactionDocument rd = ReactionDocument.builder()
                                .postId(savedPost.getId())
                                .userId(reactor.getId())
                                .type(type)
                                .createdAt(Instant.now())
                                .build();
                        reactionRepository.save(rd);
                        reactedUserIds.add(reactor.getId());
                        reactionsCreated++;

                        rxCount.put(type, rxCount.getOrDefault(type, 0) + 1);
                    }
                    savedPost.setReactionsCount(rxCount);

                    // 5. Sinh ngẫu nhiên 1-3 Comment
                    int commentNum = 1 + random.nextInt(3); // 1, 2, 3
                    for (int c = 0; c < commentNum; c++) {
                        UserDocument commenter = createdUsers.get(random.nextInt(createdUsers.size()));
                        // Hạn chế tự comment bài mình cho tự nhiên
                        if (commenter.getId().equals(author.getId())) {
                            commenter = createdUsers.get((createdUsers.indexOf(commenter) + 1) % createdUsers.size());
                        }

                        CommentDocument cd = new CommentDocument();
                        cd.setPostId(savedPost.getId());
                        cd.setAuthorId(commenter.getId());
                        cd.setContent(commentTemplates.get(random.nextInt(commentTemplates.size())));
                        cd.setDeleted(false);
                        cd.setCreatedAt(Instant.now().minusSeconds(c * 600L + 100));
                        cd.setUpdatedAt(Instant.now().minusSeconds(c * 600L + 100));
                        commentRepository.save(cd);
                        commentsCreated++;
                    }
                    savedPost.setCommentCount(commentNum);
                    postRepository.save(savedPost);
                }
            }
        }

        stats.put("posts_created", postsCreated);
        stats.put("comments_created", commentsCreated);
        stats.put("reactions_created", reactionsCreated);

        log.info("[DevSeed] Sinh dữ liệu mẫu hoàn tất: Users={}, Friendships={}, Posts={}", 
            stats.get("users_created"), stats.get("friendships_created"), stats.get("posts_created"));

        ApiResponse<Map<String, Object>> apiResponse = ApiResponse.<Map<String, Object>>builder()
            .status(HttpStatus.OK.value())
            .message("Dev data seeded successfully")
            .data(stats)
            .build();

        return ResponseEntity.ok(apiResponse);
    }
}
